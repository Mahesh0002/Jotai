import pytest

from runner.agents.router import classify_intent
from runner.llm_provider import StubProvider


@pytest.fixture(autouse=True)
def reset_stub():
    StubProvider.reset()
    yield
    StubProvider.reset()


RULE_CASES = [
    ("add a task to buy groceries", "TASK"),
    ("mark finish report as done", "TASK"),
    ("delete task 123", "TASK"),
    ("create a goal to run a marathon", "GOAL"),
    ("save $5000 this year", "GOAL"),
    ("meditate every morning", "HABIT"),
    ("build a habit of reading", "HABIT"),
    ("plan my day tomorrow", "PLAN"),
    ("schedule focus blocks for tomorrow", "PLAN"),
    ("analyze my habit patterns", "INSIGHT"),
    ("how am I doing this week", "INSIGHT"),
    ("add a habit to meditate every day", "HABIT"),
    ("plan a surprise party", "PLAN"),
]


@pytest.mark.parametrize("text,expected", RULE_CASES)
def test_rule_and_exact_fast_paths(text, expected):
    result = classify_intent(text, llm=StubProvider())
    assert result["intent"] == expected
    assert result["stage"] in ("rule", "exact")


def test_exact_scheduled_trigger_plan():
    result = classify_intent("plan_tomorrow", llm=StubProvider())
    assert result == {
        "intent": "PLAN",
        "stage": "exact",
        "raw": "plan_tomorrow",
        "scores": {},
    }


def test_exact_scheduled_trigger_insight():
    result = classify_intent("habit_insight", llm=StubProvider())
    assert result["intent"] == "INSIGHT"
    assert result["stage"] == "exact"


def test_exact_action_name():
    result = classify_intent("task.delete", llm=StubProvider())
    assert result["intent"] == "TASK"
    assert result["stage"] == "exact"


def test_empty_input_falls_to_llm_and_returns_unknown():
    result = classify_intent("", llm=StubProvider())
    assert result["intent"] == "UNKNOWN"
    assert result["stage"] == "llm"


def test_gibberish_falls_to_llm_and_returns_unknown():
    result = classify_intent("asdfghjkl", llm=StubProvider())
    assert result["intent"] == "UNKNOWN"
    assert result["stage"] == "llm"
    assert result["raw"] == "UNKNOWN"


def test_ambiguous_goal_vs_habit_uses_llm():
    StubProvider.set_responses(["HABIT"])
    result = classify_intent("create a goal and a habit", llm=StubProvider())
    assert result["intent"] == "HABIT"
    assert result["stage"] == "llm"


def test_ambiguous_plan_vs_task_uses_llm():
    StubProvider.set_responses(["PLAN"])
    result = classify_intent("schedule my tasks", llm=StubProvider())
    assert result["intent"] == "PLAN"
    assert result["stage"] == "llm"


def test_no_keyword_sentence_uses_llm():
    StubProvider.set_responses(["TASK"])
    result = classify_intent("do the thing", llm=StubProvider())
    assert result["intent"] == "TASK"
    assert result["stage"] == "llm"


def test_llm_invalid_output_becomes_unknown():
    StubProvider.set_responses(["banana"])
    result = classify_intent("do the thing", llm=StubProvider())
    assert result["intent"] == "UNKNOWN"
    assert result["stage"] == "llm_invalid"
    assert result["raw"] == "banana"


def test_no_silent_default_to_plan():
    result = classify_intent("hello there", llm=StubProvider())
    assert result["intent"] != "PLAN"
    assert result["intent"] == "UNKNOWN"
