import logging
from typing import Any, Callable, Dict, List, Optional

from pydantic import BaseModel

from runner.actions.registry import registry
from runner.api_client import api_client
from runner.services.knowledge_index import knowledge_index
from runner.config import settings

logger = logging.getLogger(__name__)


class ToolSpec(BaseModel):
    name: str
    description: str
    parameters_json_schema: dict
    handler: Callable
    requires_confirmation: bool = False


class ToolRegistry:
    def __init__(self):
        self.tools: Dict[str, ToolSpec] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        """Register all default tools"""
        # Task tools
        self.register(ToolSpec(
            name="list_tasks",
            description="List tasks with optional filters",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["not_started", "in_progress", "blocked", "completed"]},
                    "due_before": {"type": "string", "format": "date-time"},
                    "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                },
            },
            handler=self._list_tasks,
        ))

        self.register(ToolSpec(
            name="get_task",
            description="Get a single task by ID",
            parameters_json_schema={
                "type": "object",
                "properties": {"task_id": {"type": "string"}},
                "required": ["task_id"],
            },
            handler=self._get_task,
        ))

        self.register(ToolSpec(
            name="create_task",
            description="Create a new task",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                    "due_date": {"type": "string", "format": "date-time"},
                    "estimated_minutes": {"type": "integer"},
                    "project_id": {"type": "string"},
                    "tags": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["title"],
            },
            handler=self._create_task,
        ))

        self.register(ToolSpec(
            name="complete_task",
            description="Mark a task as completed",
            parameters_json_schema={
                "type": "object",
                "properties": {"task_id": {"type": "string"}},
                "required": ["task_id"],
            },
            handler=self._complete_task,
        ))

        self.register(ToolSpec(
            name="delete_task",
            description="Delete a task (requires confirmation)",
            parameters_json_schema={
                "type": "object",
                "properties": {"task_id": {"type": "string"}},
                "required": ["task_id"],
            },
            handler=self._delete_task,
            requires_confirmation=True,
        ))

        # Goal tools
        self.register(ToolSpec(
            name="list_goals",
            description="List all goals",
            parameters_json_schema={"type": "object", "properties": {}},
            handler=self._list_goals,
        ))

        self.register(ToolSpec(
            name="create_goal",
            description="Create a new goal",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "due_date": {"type": "string", "format": "date-time"},
                },
                "required": ["title"],
            },
            handler=self._create_goal,
        ))

        self.register(ToolSpec(
            name="delete_goal",
            description="Delete a goal (requires confirmation)",
            parameters_json_schema={
                "type": "object",
                "properties": {"goal_id": {"type": "string"}},
                "required": ["goal_id"],
            },
            handler=self._delete_goal,
            requires_confirmation=True,
        ))

        self.register(ToolSpec(
            name="update_goal_progress",
            description="Update goal progress percentage",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "goal_id": {"type": "string"},
                    "progress": {"type": "integer", "minimum": 0, "maximum": 100},
                },
                "required": ["goal_id", "progress"],
            },
            handler=self._update_goal_progress,
        ))

        # Note tools
        self.register(ToolSpec(
            name="list_notes",
            description="List notes (metadata only)",
            parameters_json_schema={
                "type": "object",
                "properties": {"limit": {"type": "integer", "default": 20}},
            },
            handler=self._list_notes,
        ))

        self.register(ToolSpec(
            name="search_notes",
            description="Search notes semantically using local embeddings",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "limit": {"type": "integer", "default": 8},
                },
                "required": ["query"],
            },
            handler=self._search_notes,
        ))

        self.register(ToolSpec(
            name="get_note",
            description="Get full note content by ID",
            parameters_json_schema={
                "type": "object",
                "properties": {"note_id": {"type": "string"}},
                "required": ["note_id"],
            },
            handler=self._get_note,
        ))

        # Status & metrics
        self.register(ToolSpec(
            name="get_status",
            description="Get computed status snapshot with real numbers",
            parameters_json_schema={"type": "object", "properties": {}},
            handler=self._get_status,
        ))

        self.register(ToolSpec(
            name="get_metrics",
            description="Get weekly productivity metrics",
            parameters_json_schema={"type": "object", "properties": {}},
            handler=self._get_metrics,
        ))

        # Calendar tools
        self.register(ToolSpec(
            name="get_calendar",
            description="Get calendar events for a date range",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time"},
                    "end_date": {"type": "string", "format": "date-time"},
                },
            },
            handler=self._get_calendar,
        ))

        self.register(ToolSpec(
            name="pull_calendar",
            description="Sync calendar from local ICS and return events",
            parameters_json_schema={"type": "object", "properties": {}},
            handler=self._pull_calendar,
        ))

        self.register(ToolSpec(
            name="create_focus_block",
            description="Create a focus block and update calendar ICS",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "task_id": {"type": "string"},
                    "start_time": {"type": "string", "format": "date-time"},
                    "end_time": {"type": "string", "format": "date-time"},
                },
                "required": ["title", "start_time", "end_time"],
            },
            handler=self._create_focus_block,
        ))

        # Planning & workout
        self.register(ToolSpec(
            name="propose_schedule",
            description="Propose a conflict-free schedule from tasks and calendar",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "task_ids": {"type": "array", "items": {"type": "string"}},
                },
            },
            handler=self._propose_schedule,
        ))

        self.register(ToolSpec(
            name="suggest_workout",
            description="Suggest a workout based on schedule gaps and habit history",
            parameters_json_schema={"type": "object", "properties": {}},
            handler=self._suggest_workout,
        ))

        # Keep existing estimation tools
        self.register(ToolSpec(
            name="estimate_task_duration",
            description="Estimate task duration from history",
            parameters_json_schema={
                "type": "object",
                "properties": {"task_title": {"type": "string"}},
                "required": ["task_title"],
            },
            handler=self._estimate_task_duration,
        ))

        self.register(ToolSpec(
            name="suggest_subtasks",
            description="Suggest subtasks for a task",
            parameters_json_schema={
                "type": "object",
                "properties": {"task_title": {"type": "string"}},
                "required": ["task_title"],
            },
            handler=self._suggest_subtasks,
        ))

    def register(self, spec: ToolSpec):
        self.tools[spec.name] = spec
        # Also register with action registry for confirmation handling
        if spec.requires_confirmation:
            registry.register(spec.name, spec.description, spec.handler, requires_confirmation=True)
        else:
            registry.register(spec.name, spec.description, spec.handler, requires_confirmation=False)

    def descriptors(self) -> List[ToolSpec]:
        return list(self.tools.values())

    def execute(self, name: str, args: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """Execute a tool by name"""
        if name not in self.tools:
            return {"success": False, "message": f"Unknown tool: {name}"}

        tool = self.tools[name]
        try:
            result = tool.handler(**args, session_id=session_id)
            return result
        except Exception as e:
            logger.error(f"Tool {name} error: {e}")
            return {"success": False, "message": str(e)}

    # Tool handlers
    def _list_tasks(self, status: str = None, due_before: str = None, priority: str = None, session_id: str = None):
        params = {}
        if status: params["status"] = status
        if due_before: params["endDate"] = due_before
        if priority: params["priority"] = priority
        tasks = api_client.get_tasks(**params)
        return {"success": True, "data": tasks}

    def _get_task(self, task_id: str, session_id: str = None):
        task = api_client.get_task(task_id)
        return {"success": True, "data": task}

    def _create_task(self, title: str, description: str = "", priority: str = "medium",
                     due_date: str = None, estimated_minutes: int = None,
                     project_id: str = None, tags: list = None, session_id: str = None):
        data = {"title": title, "description": description, "priority": priority}
        if due_date: data["due_date"] = due_date
        if estimated_minutes: data["estimated_minutes"] = estimated_minutes
        if project_id: data["project_id"] = project_id
        if tags: data["tags"] = tags
        result = api_client._post("/tasks", data)
        return {"success": True, "data": result.get("data", {})}

    def _complete_task(self, task_id: str, session_id: str = None):
        result = api_client._post(f"/tasks/{task_id}/complete", {})
        return {"success": True, "data": result.get("data", {})}

    def _delete_task(self, task_id: str, session_id: str = None):
        # This goes through action registry for confirmation
        result = registry.execute("task.delete", {"taskId": task_id})
        return result

    def _list_goals(self, session_id: str = None):
        goals = api_client._get("/goals").get("data", [])
        return {"success": True, "data": goals}

    def _create_goal(self, title: str, description: str = "", due_date: str = None, session_id: str = None):
        data = {"title": title, "description": description}
        if due_date: data["due_date"] = due_date
        result = api_client._post("/goals", data)
        return {"success": True, "data": result.get("data", {})}

    def _delete_goal(self, goal_id: str, session_id: str = None):
        result = registry.execute("goal.delete", {"goalId": goal_id})
        return result

    def _update_goal_progress(self, goal_id: str, progress: int, session_id: str = None):
        result = api_client._patch(f"/goals/{goal_id}", {"progress": progress})
        return {"success": True, "data": result.get("data", {})}

    def _list_notes(self, limit: int = 20, session_id: str = None):
        notes = api_client.get_notes()
        return {"success": True, "data": notes[:limit]}

    def _search_notes(self, query: str, limit: int = 8, session_id: str = None):
        results = knowledge_index.search(query, top_k=limit)
        return {"success": True, "data": results}

    def _get_note(self, note_id: str, session_id: str = None):
        note = api_client.get_note(note_id)
        return {"success": True, "data": note}

    def _get_status(self, session_id: str = None):
        status = api_client.get_status()
        return {"success": True, "data": status}

    def _get_metrics(self, session_id: str = None):
        metrics = api_client.get_metrics()
        return {"success": True, "data": metrics}

    def _get_calendar(self, start_date: str = None, end_date: str = None, session_id: str = None):
        params = {}
        if start_date: params["startDate"] = start_date
        if end_date: params["endDate"] = end_date
        events = api_client.get_calendar_events(**params)
        return {"success": True, "data": events}

    def _pull_calendar(self, session_id: str = None):
        result = api_client.sync_calendar()
        return {"success": True, "data": result}

    def _create_focus_block(self, title: str, start_time: str, end_time: str,
                            task_id: str = None, session_id: str = None):
        data = {"title": title, "startTime": start_time, "endTime": end_time}
        if task_id: data["taskId"] = task_id
        result = api_client.create_focus_block(data)
        return {"success": True, "data": result.get("data", {})}

    def _propose_schedule(self, task_ids: list = None, session_id: str = None):
        # Use existing planning agent
        from runner.agents.planning import run_planning_agent
        result = run_planning_agent(task_ids)
        return {"success": True, "data": result}

    def _suggest_workout(self, session_id: str = None):
        from runner.agents.workout import suggest_workout
        result = suggest_workout()
        return {"success": True, "data": result}

    def _estimate_task_duration(self, task_title: str, session_id: str = None):
        from runner.agents.tools import estimate_task_duration
        result = estimate_task_duration(task_title)
        return {"success": True, "data": result}

    def _suggest_subtasks(self, task_title: str, session_id: str = None):
        from runner.agents.tools import suggest_subtasks
        result = suggest_subtasks(task_title)
        return {"success": True, "data": result}


tool_registry = ToolRegistry()