import json
from unittest.mock import MagicMock, patch

from runner.agents.planning import check_schedule_constraints, run_planning_agent
from runner.llm_provider import LLMResponse


CONFLICTING_BLOCK = [
    {"taskId": "t1", "title": "Deep work", "startTime": "2026-11-14T10:00:00Z", "endTime": "2026-11-14T11:00:00Z"}
]
SAFE_BLOCK = [
    {"taskId": "t1", "title": "Deep work", "startTime": "2026-11-14T12:00:00Z", "endTime": "2026-11-14T13:00:00Z"}
]
EVENT = {
    "title": "NLP Lecture",
    "start": 1794652200000,  # 2026-11-14T10:30:00Z
    "end": 1794655800000,    # 2026-11-14T11:30:00Z
}


def test_overlap_is_detected():
    blocks = [
        {"startTime": "2026-11-14T10:00:00Z", "endTime": "2026-11-14T11:00:00Z"},
        {"startTime": "2026-11-14T10:30:00Z", "endTime": "2026-11-14T12:00:00Z"},
    ]
    assert "Overlap" in check_schedule_constraints(blocks)


def test_calendar_conflict_is_detected():
    error = check_schedule_constraints(CONFLICTING_BLOCK, [EVENT])
    assert "Conflicts with calendar event 'NLP Lecture'" in error


@patch("runner.agents.planning.api_client")
@patch("runner.agents.planning.get_llm_provider")
def test_calendar_conflict_forces_a_revision(mock_get_llm, mock_api):
    llm = MagicMock()
    llm.generate.side_effect = [
        LLMResponse(content=json.dumps(CONFLICTING_BLOCK)),
        LLMResponse(content=json.dumps(SAFE_BLOCK)),
    ]
    mock_get_llm.return_value = llm
    mock_api.get_tasks.return_value = []
    mock_api.get_calendar_events.return_value = [EVENT]
    mock_api.get_decision_logs.return_value = []
    mock_api.create_proposal.return_value = {"success": True}

    run_planning_agent()

    assert llm.generate.call_count == 2
    second_prompt = llm.generate.call_args_list[1].args[0]
    assert "Conflicts with calendar event" in second_prompt
    proposal_data = mock_api.create_proposal.call_args.args[1]
    assert proposal_data["flags"] == []
    assert proposal_data["calendarChecked"] is True


@patch("runner.agents.planning.api_client")
@patch("runner.agents.planning.get_llm_provider")
def test_persistent_conflict_is_flagged_after_three_attempts(mock_get_llm, mock_api):
    llm = MagicMock()
    llm.generate.return_value = LLMResponse(content=json.dumps(CONFLICTING_BLOCK))
    mock_get_llm.return_value = llm
    mock_api.get_tasks.return_value = []
    mock_api.get_calendar_events.return_value = [EVENT]
    mock_api.get_decision_logs.return_value = []
    mock_api.create_proposal.return_value = {"success": True}

    run_planning_agent()

    assert llm.generate.call_count == 3
    proposal_data = mock_api.create_proposal.call_args.args[1]
    assert "constraint_violation" in proposal_data["flags"]


@patch("runner.agents.planning.api_client")
@patch("runner.agents.planning.get_llm_provider")
def test_preference_profile_is_injected_into_planning_prompt(mock_get_llm, mock_api):
    llm = MagicMock()
    llm.generate.return_value = LLMResponse(content=json.dumps(SAFE_BLOCK))
    mock_get_llm.return_value = llm
    mock_api.get_tasks.return_value = []
    mock_api.get_calendar_events.return_value = []
    mock_api.get_decision_logs.return_value = [
        {"decision": "rejected", "attributes": {"timeOfDay": "morning"}},
    ]
    mock_api.create_proposal.return_value = {"success": True}

    run_planning_agent()

    prompt = llm.generate.call_args.args[0]
    assert "Past proposal decisions: morning rejected 1/1." in prompt
