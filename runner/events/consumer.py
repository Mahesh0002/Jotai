import json
import logging
import threading
import time

from runner.api_client import api_client
from runner.services.suggestion_service import create_suggestion
from runner.services.context_engine import get_aggregated_context

logger = logging.getLogger(__name__)

_consumer_thread = None
_stop_event = None


def handle_event(event: dict) -> None:
    """Process a single event from the long-poll"""
    try:
        event_type = event.get("eventType")
        logger.info(f"[Event Consumer] Processing event: {event_type} ({event.get('eventId')})")

        if event_type == "TASK_COMPLETED":
            context = get_aggregated_context()
            tasks_remaining = context.get("today", {}).get("tasks_remaining", 0)
            if tasks_remaining == 0:
                create_suggestion(
                    type="all_tasks_completed",
                    priority="low",
                    title="Amazing job today!",
                    message="You've completed all your tasks for today. Would you like me to draft tomorrow's schedule?",
                    targetModule="today",
                    actions=["plan_tomorrow"],
                )

        elif event_type == "NOTE_CHANGED":
            # Trigger knowledge index refresh
            from runner.services.knowledge_index import knowledge_index
            knowledge_index.rebuild()

        elif event_type == "SCHEDULE_UPDATED":
            # UI handles invalidation, no-op here
            pass

        elif event_type in ("FOCUS_STARTED", "FOCUS_COMPLETED"):
            # Could trigger break reminders
            pass

    except Exception as exc:
        logger.error(f"[Event Consumer] Error handling event: {exc}")


def consumer_loop(stop_event: threading.Event) -> None:
    """Long-poll loop for events"""
    last_id = 0
    logger.info("[Event Consumer] Starting long-poll listener...")

    while not stop_event.is_set():
        try:
            result = api_client.get_events(after_id=last_id, timeout=20000)
            data = result.get("data", {})
            events = data.get("events", [])
            last_id = data.get("lastId", last_id)

            for event in events:
                handle_event(event.get("payload", {}))

        except Exception as exc:
            logger.error(f"[Event Consumer] Loop error: {exc}")
            time.sleep(2)  # Back off on error


def start_consumer() -> threading.Event:
    global _consumer_thread, _stop_event
    _stop_event = threading.Event()
    thread = threading.Thread(target=consumer_loop, args=(_stop_event,), daemon=True)
    thread.start()
    _consumer_thread = thread
    return _stop_event


def stop_consumer(stop_event: threading.Event) -> None:
    global _consumer_thread, _stop_event
    if stop_event:
        stop_event.set()
    _stop_event = None
    thread = _consumer_thread
    _consumer_thread = None
    if thread is not None and thread is not threading.current_thread():
        thread.join(timeout=5)