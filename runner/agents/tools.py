from datetime import date
from actions.registry import registry
import actions.task_actions
import actions.goal_actions
import actions.habit_actions


def create_task(title: str, due_date: str = "") -> dict:
    """
    Creates a one-time, completable action.
    Args:
        title: Task title.
        due_date: Optional ISO date string (default: today).
    """
    params = {"title": title}
    # Default to today if no due date specified
    params["dueDate"] = due_date if due_date else f"{date.today().isoformat()}T00:00:00.000Z"

    try:
        result = registry.execute("task.create", params)
        return result
    except Exception as e:
        return {"success": False, "message": str(e)}


def complete_task(task_id: str) -> dict:
    """
    Marks a task as completed.
    Args:
        task_id: Task ID.
    """
    try:
        result = registry.execute("task.complete", {"taskId": task_id})
        return result
    except Exception as e:
        return {"success": False, "message": str(e)}


def delete_task(task_id: str) -> dict:
    """
    Deletes a task permanently.
    Args:
        task_id: Task ID.
    """
    try:
        result = registry.execute("task.delete", {"taskId": task_id})
        return result
    except Exception as e:
        return {"success": False, "message": str(e)}


def create_goal(title: str, description: str = "") -> dict:
    """
    Creates a measurable outcome or milestone (e.g. "Run a marathon").
    Args:
        title: Goal statement.
        description: Optional context.
    """
    params = {"title": title}
    if description:
        params["description"] = description

    try:
        result = registry.execute("goal.create", params)
        return result
    except Exception as e:
        return {"success": False, "message": str(e)}


def delete_goal(goal_id: str) -> dict:
    """
    Deletes a goal permanently.
    Args:
        goal_id: Goal ID.
    """
    try:
        result = registry.execute("goal.delete", {"goalId": goal_id})
        return result
    except Exception as e:
        return {"success": False, "message": str(e)}


def create_habit(name: str, frequency_type: str = "every_day") -> dict:
    """
    Creates a recurring daily behavior (e.g. "Meditate").
    Args:
        name: Habit name.
        frequency_type: "every_day", "weekdays", "weekends", or "custom".
    """
    try:
        result = registry.execute("habit.create", {
            "name": name,
            "frequencyType": frequency_type
        })
        return result
    except Exception as e:
        return {"success": False, "message": str(e)}


def delete_habit(habit_id: str) -> dict:
    """
    Deletes a habit definition permanently.
    Args:
        habit_id: Habit ID.
    """
    try:
        result = registry.execute("habit.delete", {"habitId": habit_id})
        return result
    except Exception as e:
        return {"success": False, "message": str(e)}
