import json
from unittest.mock import MagicMock, patch

from runner.agents.habit_insight import run_habit_insight_agent
from runner.llm_provider import LLMResponse


@patch("runner.agents.habit_insight.api_client")
@patch("runner.agents.habit_insight.get_llm_provider")
def test_habit_insight_narrates_computed_stats_and_injects_profile(mock_get_llm, mock_api):
    llm = MagicMock()
    llm.generate.return_value = LLMResponse(
        content=json.dumps(
            {
                "title": "Steady week",
                "description": "You completed 1 of 2 scheduled habit-days.",
                "action": "Keep the same routine next week.",
            }
        )
    )
    mock_get_llm.return_value = llm
    mock_api.get_habit_consistency.return_value = [
        {"name": "Meditate", "streak": 3, "days": [True, False]},
    ]
    mock_api.get_focus_history.return_value = [
        {"type": "deep_work", "elapsedSeconds": 3600},
    ]
    mock_api.get_decision_logs.return_value = [
        {"decision": "rejected", "attributes": {"timeOfDay": "morning"}},
    ]
    mock_api.create_proposal.return_value = {"success": True}

    run_habit_insight_agent()

    prompt = llm.generate.call_args.args[0]
    assert "Completed 1 of 2" in prompt
    assert "Past proposal decisions: morning rejected 1/1." in prompt

    proposal_type, proposal_data = mock_api.create_proposal.call_args.args
    assert proposal_type == "habit_insight"
    assert proposal_data["stats"]["completed_days"] == 1
    assert proposal_data["narrated"] is True


@patch("runner.agents.habit_insight.api_client")
@patch("runner.agents.habit_insight.get_llm_provider")
def test_habit_insight_falls_back_to_stats_when_json_is_bad(mock_get_llm, mock_api):
    mock_get_llm.return_value.generate.return_value = LLMResponse(content="not json")
    mock_api.get_habit_consistency.return_value = [
        {"name": "Read", "streak": 1, "days": [True, True]},
    ]
    mock_api.get_focus_history.return_value = []
    mock_api.get_decision_logs.return_value = []
    mock_api.create_proposal.return_value = {"success": True}

    run_habit_insight_agent()

    _, proposal_data = mock_api.create_proposal.call_args.args
    assert proposal_data["narrated"] is False
    assert "Completed 2 of 2" in proposal_data["description"]
    assert proposal_data["stats"]["completed_days"] == 2
