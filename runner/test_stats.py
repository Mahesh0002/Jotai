from runner.services.stats import (
    build_preference_profile,
    estimate_duration,
    summarize_habit_consistency,
)


def test_estimate_duration_uses_median_focus_time_of_similar_tasks():
    task = {"_id": "t1", "projectId": "p1", "tags": ["deep"], "priority": "high"}
    completed = [
        {"_id": "t2", "status": "completed", "projectId": "p1", "tags": ["deep"], "priority": "high"},
        {"_id": "t3", "status": "completed", "projectId": "p1", "tags": [], "priority": "low"},
        {"_id": "t4", "status": "completed", "projectId": "p2", "tags": [], "priority": "low"},
    ]
    focus = [
        {"taskId": "t2", "elapsedSeconds": 3600},
        {"taskId": "t3", "elapsedSeconds": 1800},
        {"taskId": "t4", "elapsedSeconds": 6000},
    ]

    result = estimate_duration(task, completed, focus)

    assert result["minutes"] == 45
    assert result["sample_size"] == 2
    assert result["source"] == "focus_history"
    assert result["used_similarity"] is True


def test_estimate_duration_falls_back_to_task_estimates():
    task = {"_id": "t1", "projectId": "p1", "tags": [], "priority": "high"}
    completed = [
        {"_id": "t2", "status": "completed", "projectId": "p1", "priority": "high", "estimatedMinutes": 30},
        {"_id": "t3", "status": "completed", "projectId": "p1", "priority": "high", "estimatedMinutes": 90},
    ]

    result = estimate_duration(task, completed, [])
    assert result["minutes"] == 60
    assert result["source"] == "task_estimates"
    assert result["sample_size"] == 2


def test_estimate_duration_with_no_history_is_explicit():
    result = estimate_duration({"_id": "t1"}, [], [])
    assert result["minutes"] is None
    assert result["source"] == "no_history"
    assert result["sample_size"] == 0


def test_estimate_duration_ignores_incomplete_tasks():
    task = {"_id": "t1", "projectId": "p1", "priority": "high"}
    completed = [
        {"_id": "t2", "status": "in_progress", "projectId": "p1", "priority": "high", "estimatedMinutes": 120},
    ]
    result = estimate_duration(task, completed, [])
    assert result["minutes"] is None


def test_preference_profile_is_deterministic_and_compact():
    logs = [
        {"decision": "rejected", "attributes": {"timeOfDay": "morning"}},
        {"decision": "rejected", "attributes": {"timeOfDay": "morning"}},
        {"decision": "rejected", "attributes": {"timeOfDay": "morning"}},
        {"decision": "rejected", "attributes": {"timeOfDay": "morning"}},
        {"decision": "accepted", "attributes": {"timeOfDay": "afternoon", "durationMinutes": 30, "focusType": "deep_work"}},
        {"decision": "accepted", "attributes": {"timeOfDay": "afternoon", "durationMinutes": 50, "focusType": "deep_work"}},
        {"decision": "accepted", "attributes": {"timeOfDay": "afternoon", "durationMinutes": 60, "focusType": "deep_work"}},
        {"decision": "accepted", "attributes": {"timeOfDay": "afternoon", "durationMinutes": 70, "focusType": "deep_work"}},
        {"decision": "rejected", "attributes": {"timeOfDay": "afternoon", "focusType": "admin"}},
    ]

    profile = build_preference_profile(logs)

    assert "morning rejected 4/4" in profile
    assert "afternoon rejected 1/5" in profile
    assert "preferred block 55 min" in profile
    assert "deep_work accepted 4/4" in profile
    assert "admin accepted 0/1" in profile
    assert build_preference_profile(logs) == profile


def test_preference_profile_empty_log():
    assert build_preference_profile([]) == "No past proposal decisions recorded."


def test_habit_stats_are_computed_in_python():
    consistency = [
        {"name": "Meditate", "streak": 3, "days": [True, True, False, True, True, True, True]},
        {"name": "Read", "streak": 1, "days": [True, False, False, False, False, False, False]},
    ]
    focus = [
        {"type": "deep_work", "elapsedSeconds": 3600},
        {"type": "reading", "durationMinutes": 30},
        {"type": "break", "elapsedSeconds": 0},
    ]

    stats = summarize_habit_consistency(consistency, focus)

    assert stats["habit_count"] == 2
    assert stats["scheduled_days"] == 14
    assert stats["completed_days"] == 7
    assert stats["completion_rate"] == 0.5
    assert stats["focus_sessions"] == 2
    assert stats["focus_minutes_total"] == 90
    assert stats["focus_minutes_by_type"] == {"deep_work": 60, "reading": 30}
