from datetime import datetime, timezone

from runner.agents import deterministic


def test_in_domain_plans_are_explicit_and_tool_backed():
    cases = {
        "add a task to buy groceries tomorrow at 3pm": "task.create",
        "mark finish report as done": "task.complete",
        "delete task 123": "task.delete",
        "create a goal to run a marathon": "goal.create",
        "add a habit to meditate every day": "habit.create",
        "add a focus block tomorrow at 3pm": "calendar.add",
        "search notes about database": "note.search",
        "show my tasks": "task.list",
        "plan my day": "daily.update",
    }
    for text, tool in cases.items():
        plan = deterministic.plan(text)
        assert plan is not None, text
        assert plan["tool"] == tool, text
        assert plan["tool"] in deterministic.TOOL_NAMES
        assert "intent" in plan


def test_out_of_domain_is_not_routed_to_a_tool():
    assert deterministic.plan("what is the meaning of life") is None
    assert deterministic.plan("") is None


def test_missing_arguments_ask_for_clarification_instead_of_guessing():
    plan = deterministic.plan("delete the task")
    assert plan["tool"] is None
    assert "clarify" in plan


def test_date_and_time_are_parsed_deterministically():
    now = datetime(2026, 11, 26, 12, 0, tzinfo=timezone.utc)
    when, day, cleaned = deterministic.parse_when("buy milk tomorrow at 3pm", now=now)
    assert when == "2026-11-27T15:00:00Z"
    assert day == "Friday"
    assert "tomorrow" not in cleaned.lower()
    assert "3pm" not in cleaned.lower()
