import json
from unittest.mock import MagicMock, patch

from runner.agents.tools import suggest_subtasks
from runner.llm_provider import LLMResponse, StubProvider, is_rate_limit_error


class RateLimitError(Exception):
    code = 429


class BadRequestError(Exception):
    code = 400


class UnauthorizedError(Exception):
    status_code = 401


def test_rate_limit_predicate_accepts_only_429():
    assert is_rate_limit_error(RateLimitError()) is True
    assert is_rate_limit_error(BadRequestError()) is False
    assert is_rate_limit_error(UnauthorizedError()) is False


def test_stub_provider_is_scriptable():
    StubProvider.set_responses(["TASK"])
    assert StubProvider().generate("classify: add something").content == "TASK"
    assert StubProvider().generate("classify: blah").content == "UNKNOWN"
    StubProvider.reset()


@patch("runner.agents.planning.api_client")
@patch("runner.agents.planning.get_llm_provider")
def test_planning_agent_self_correction_cap(mock_get_llm, mock_api):
    llm = MagicMock()
    llm.generate.return_value = LLMResponse(
        content='''[
        {"startTime": "2026-08-31T10:00:00Z", "endTime": "2026-08-31T11:00:00Z"},
        {"startTime": "2026-08-31T10:30:00Z", "endTime": "2026-08-31T12:00:00Z"}
    ]'''
    )
    mock_get_llm.return_value = llm
    mock_api.get_tasks.return_value = []
    mock_api.get_calendar_events.return_value = []
    mock_api.get_decision_logs.return_value = []
    mock_api.create_proposal.return_value = {"success": True}

    from runner.agents.planning import run_planning_agent

    run_planning_agent()

    assert llm.generate.call_count == 3
    proposal_data = mock_api.create_proposal.call_args.args[1]
    assert "constraint_violation" in proposal_data["flags"]


@patch("runner.agents.tools.api_client")
@patch("runner.agents.tools.get_llm_provider")
def test_suggest_subtasks_goes_through_proposal_path(mock_get_llm, mock_api):
    mock_api.get_task.return_value = {"_id": "t1", "title": "Ship feature"}
    mock_get_llm.return_value.generate.return_value = LLMResponse(
        content=json.dumps(["Write tests", "Implement handler", "Update docs"])
    )
    mock_api.create_proposal.return_value = {"success": True, "data": {"_id": "proposal-1"}}

    result = suggest_subtasks("t1")

    assert result["requiresConfirmation"] is True
    assert result["subtasks"] == ["Write tests", "Implement handler", "Update docs"]
    proposal_type, proposal_data = mock_api.create_proposal.call_args.args
    assert proposal_type == "subtask_suggestion"
    assert proposal_data["taskId"] == "t1"
    # No task mutation call is made at all.
    assert not hasattr(mock_api, "update_task") or not mock_api.update_task.called
