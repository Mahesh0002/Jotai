from unittest.mock import patch

from runner.actions.registry import registry
from runner.agents import orchestrator
from runner.llm_provider import LLMResponse
from runner.services.confirmation_store import confirmation_store
from runner.services.conversation_store import conversation_store


def setup_function():
    conversation_store.clear()
    confirmation_store.clear()


def test_unknown_intent_returns_a_clarifying_reply():
    with patch.object(
        orchestrator,
        "classify_intent",
        return_value={"intent": "UNKNOWN", "stage": "llm", "raw": "UNKNOWN", "scores": {}},
    ):
        result = orchestrator.run_orchestrator("qwerty", session_id="s")

    assert result["success"] is True
    assert "not sure" in result["data"]["reply"]
    assert len(conversation_store.history("s")) == 2


def test_history_in_prompt_is_capped():
    for index in range(10):
        conversation_store.append("s", "user", f"u{index}")
        conversation_store.append("s", "assistant", f"a{index}")

    captured = {}

    class FakeProvider:
        def generate(self, prompt, tools=None):
            captured["prompt"] = prompt
            return LLMResponse(content="ok")

    with patch.object(
        orchestrator,
        "classify_intent",
        return_value={"intent": "TASK", "stage": "rule", "raw": "add", "scores": {}},
    ), patch.object(orchestrator, "get_llm_provider", return_value=FakeProvider()), patch.object(
        orchestrator, "get_aggregated_context", return_value={}
    ):
        orchestrator.run_orchestrator("add a task", session_id="s")

    prompt = captured["prompt"]
    assert "u4" in prompt
    assert "u3" not in prompt


def test_pending_confirmation_survives_a_turn_and_executes_on_yes():
    executed = []
    registry.register(
        "test.delete",
        "Test delete",
        lambda params: executed.append(params) or {"success": True},
        requires_confirmation=True,
    )

    try:
        confirmation = registry.execute("test.delete", {"id": "1"})
        conversation_store.set_pending(
            "s",
            {
                "actionId": confirmation["actionId"],
                "actionName": "test.delete",
                "params": confirmation["params"],
            },
        )
        conversation_store.append("s", "user", "delete item 1")
        conversation_store.append("s", "assistant", "Are you sure?")

        result = orchestrator.run_orchestrator("yes", session_id="s")

        assert result["success"] is True
        assert executed[0]["id"] == "1"
        assert conversation_store.get_pending("s") is None
    finally:
        registry.unregister("test.delete")
