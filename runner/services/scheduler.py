import logging
from contextlib import asynccontextmanager
from datetime import datetime, time
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from runner.config import settings
from runner.api_client import api_client
from runner.llm_provider import get_llm_provider
from runner.services.knowledge_index import knowledge_index

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def run_daily_briefing():
    """Generate and post daily briefing suggestion"""
    try:
        logger.info("Running daily briefing job")
        user_id = settings.RUNNER_USER_ID

        # Gather data
        today_summary = api_client._get("/today/summary").get("data", {})
        status = api_client.get_status()
        calendar = api_client.get_calendar_events()
        tasks = api_client.get_tasks()
        habits = api_client.get_habit_logs()

        # Build briefing prompt
        prompt = f"""Write a brief daily briefing (max 120 words) for a productivity assistant.
        Today's summary:
        - Quests: {today_summary.get('quests', {})}
        - Focus: {today_summary.get('focus', {})} seconds
        - Streak: {today_summary.get('streak', 0)} days
        - Habits: {today_summary.get('habits', {})}
        - Tasks due: {today_summary.get('tasks', {})}

        Calendar events today: {len(calendar)} events
        Top tasks: {[t.get('title') for t in tasks[:3]]}
        Habit streak: {status.get('habits', {}).get('current_streak', 0)}

        Write in second person, encouraging but concise. No markdown."""

        provider = get_llm_provider()
        response = provider.generate(prompt)
        briefing_text = response.content.strip()

        # Create suggestion
        api_client._post("/assistant/suggestions", {
            "type": "daily_briefing",
            "priority": "high",
            "title": "Daily Briefing",
            "message": briefing_text,
            "targetModule": "today",
            "actions": ["plan_today", "status"],
        })

        logger.info("Daily briefing suggestion created")
    except Exception as e:
        logger.error(f"Daily briefing job failed: {e}")


async def run_workout_nudge():
    """Generate workout suggestion for configured days"""
    try:
        logger.info("Running workout nudge job")
        user_id = settings.RUNNER_USER_ID

        prefs = api_client.get_preferences()
        workout_days = prefs.get("workout_days", "mon,wed,fri").split(",")
        today = datetime.now().strftime("%a").lower()[:3]

        if today not in workout_days:
            logger.info(f"Today ({today}) not a workout day, skipping")
            return

        # Find free slot in next 2 hours
        calendar = api_client.get_calendar_events()
        focus_blocks = api_client.get_focus_history()

        # Simple: just create workout proposal via the agent tool
        # The agent's suggest_workout tool handles the logic
        api_client._post("/assistant/suggestions", {
            "type": "workout_nudge",
            "priority": "medium",
            "title": "Workout Time",
            "message": "You have a free slot for a workout. Want me to suggest one?",
            "targetModule": "today",
            "actions": ["suggest_workout", "snooze"],
        })

        logger.info("Workout nudge suggestion created")
    except Exception as e:
        logger.error(f"Workout nudge job failed: {e}")


async def run_break_reminder():
    """Send break reminder if focus block is active"""
    try:
        # Check if any focus block is active
        focus_blocks = api_client.get_focus_history()
        active = any(b.get("status") == "active" for b in focus_blocks)

        if not active:
            return

        prefs = api_client.get_preferences()
        focus_minutes = prefs.get("focus_minutes", 25)

        api_client._post("/assistant/suggestions", {
            "type": "break_reminder",
            "priority": "low",
            "title": "Break Reminder",
            "message": f"You've been focusing for ~{focus_minutes} minutes. Time for a short break?",
            "targetModule": "focus",
            "actions": ["start_break"],
        })

        logger.info("Break reminder suggestion created")
    except Exception as e:
        logger.error(f"Break reminder job failed: {e}")


async def run_note_reindex():
    """Rebuild knowledge index"""
    try:
        logger.info("Running note reindex job")
        await knowledge_index.rebuild()
    except Exception as e:
        logger.error(f"Note reindex job failed: {e}")


async def run_weekly_review():
    """Generate weekly review suggestion"""
    try:
        logger.info("Running weekly review job")
        metrics = api_client.get_metrics()

        prompt = f"""Write a brief weekly review (max 150 words) based on these metrics:
        - Focus: {metrics.get('focus_minutes', 0)} minutes
        - Task completion: {metrics.get('task_completion_rate', 0)}%
        - Plan adherence: {metrics.get('plan_adherence', 0)}%
        - Break regularity: {metrics.get('break_regularity', 0)}%
        - Workout consistency: {metrics.get('workout_consistency', 0)}%

        Trend: {metrics.get('trend', [])}

        Highlight achievements and one area to improve. Encouraging tone."""

        provider = get_llm_provider()
        response = provider.generate(prompt)

        api_client._post("/assistant/suggestions", {
            "type": "weekly_review",
            "priority": "medium",
            "title": "Weekly Review",
            "message": response.content.strip(),
            "targetModule": "analytics",
            "actions": ["view_metrics"],
        })

        logger.info("Weekly review suggestion created")
    except Exception as e:
        logger.error(f"Weekly review job failed: {e}")


def schedule_jobs():
    """Register all scheduled jobs from preferences"""
    # Clear existing jobs
    scheduler.remove_all_jobs()

    # Daily briefing
    briefing_hour, briefing_minute = map(int, settings.BRIEFING_TIME.split(":"))
    scheduler.add_job(
        run_daily_briefing,
        CronTrigger(hour=briefing_hour, minute=briefing_minute),
        id="daily_briefing",
        replace_existing=True,
    )

    # Workout nudge
    workout_hour, workout_minute = map(int, settings.WORKOUT_TIME.split(":"))
    scheduler.add_job(
        run_workout_nudge,
        CronTrigger(hour=workout_hour, minute=workout_minute, day_of_week="mon,wed,fri"),
        id="workout_nudge",
        replace_existing=True,
    )

    # Break reminder - every focus_minutes while active (handled by focus event)
    # For now, periodic check
    prefs = api_client.get_preferences()
    focus_minutes = prefs.get("focus_minutes", 25)
    scheduler.add_job(
        run_break_reminder,
        IntervalTrigger(minutes=focus_minutes),
        id="break_reminder",
        replace_existing=True,
    )

    # Note reindex
    scheduler.add_job(
        run_note_reindex,
        IntervalTrigger(seconds=settings.INDEX_REFRESH_SECONDS),
        id="note_reindex",
        replace_existing=True,
    )

    # Weekly review (Monday 08:00)
    scheduler.add_job(
        run_weekly_review,
        CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="weekly_review",
        replace_existing=True,
    )

    logger.info("Scheduled jobs registered")


@asynccontextmanager
async def lifespan(app):
    """FastAPI lifespan handler"""
    # Startup
    logger.info("Starting scheduler...")
    schedule_jobs()
    scheduler.start()

    # Warm knowledge index
    try:
        knowledge_index.load()
        if not knowledge_index._loaded:
            await knowledge_index.rebuild()
    except Exception as e:
        logger.warning(f"Knowledge index warmup failed: {e}")

    yield

    # Shutdown
    logger.info("Stopping scheduler...")
    scheduler.shutdown(wait=True)