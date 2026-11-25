from runner.services.conversation_store import ConversationStore


def test_history_is_capped_at_six_turns():
    store = ConversationStore(max_turns=6)
    for index in range(10):
        store.append("session", "user", f"u{index}")
        store.append("session", "assistant", f"a{index}")

    history = store.history("session")
    assert len(history) == 12
    assert history[0]["content"] == "u4"
    assert history[-1]["content"] == "a9"


def test_pending_confirmation_survives_a_turn():
    store = ConversationStore(max_turns=2)
    pending = {"actionId": "action-1", "actionName": "task.delete", "params": {"taskId": "1"}}
    store.set_pending("session", pending)

    store.append("session", "user", "delete task 1")
    store.append("session", "assistant", "Are you sure?")

    assert store.get_pending("session") == pending
    assert len(store.history("session")) == 2


def test_history_and_pending_are_per_session():
    store = ConversationStore(max_turns=1)
    store.append("a", "user", "one")
    store.append("b", "user", "two")
    store.set_pending("a", {"actionId": "x", "actionName": "task.delete", "params": {}})

    assert store.history("a")[0]["content"] == "one"
    assert store.history("b")[0]["content"] == "two"
    assert store.get_pending("b") is None
