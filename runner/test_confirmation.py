from runner.actions.registry import ActionRegistry
from runner.services.confirmation_store import confirmation_store


def setup_function():
    confirmation_store.clear()


def test_destructive_action_requires_confirmation():
    registry = ActionRegistry()
    executed = []
    registry.register(
        "task.delete",
        "Delete a task",
        lambda params: executed.append(params) or {"success": True},
        requires_confirmation=True,
    )

    result = registry.execute("task.delete", {"taskId": "1"})
    assert result["confirmationRequired"] is True
    assert result["actionId"]
    assert executed == []


def test_confirmation_is_single_use():
    registry = ActionRegistry()
    executed = []
    registry.register(
        "task.delete",
        "Delete a task",
        lambda params: executed.append(params) or {"success": True},
        requires_confirmation=True,
    )

    confirmation = registry.execute("task.delete", {"taskId": "1"})
    action_id = confirmation["actionId"]

    first = registry.execute("task.delete", {}, confirmed_action_id=action_id)
    assert first["success"] is True
    assert executed[0]["taskId"] == "1"

    replay = registry.execute("task.delete", {}, confirmed_action_id=action_id)
    assert replay["success"] is False
    assert replay["confirmationRequired"] is True
    assert len(executed) == 1


def test_wrong_action_id_is_rejected():
    registry = ActionRegistry()
    registry.register(
        "task.delete",
        "Delete a task",
        lambda params: {"success": True},
        requires_confirmation=True,
    )
    result = registry.execute("task.delete", {"taskId": "1"}, confirmed_action_id="not-issued")
    assert result["success"] is False


def test_payload_cannot_be_swapped_after_confirmation():
    registry = ActionRegistry()
    executed = []
    registry.register(
        "task.delete",
        "Delete a task",
        lambda params: executed.append(params) or {"success": True},
        requires_confirmation=True,
    )

    confirmation = registry.execute("task.delete", {"taskId": "safe"})
    registry.execute(
        "task.delete",
        {"taskId": "attacker-chosen"},
        confirmed_action_id=confirmation["actionId"],
    )

    assert executed[0]["taskId"] == "safe"


def test_non_destructive_action_executes_immediately():
    registry = ActionRegistry()
    registry.register(
        "task.create",
        "Create a task",
        lambda params: {"success": True, "params": params},
        requires_confirmation=False,
    )
    result = registry.execute("task.create", {"title": "Test"})
    assert result["success"] is True
    assert result["params"]["title"] == "Test"
    assert result["params"]["actionId"]
