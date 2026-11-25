import json
import threading
import time

import redis

from runner.config import settings
from runner.services.context_engine import get_aggregated_context
from runner.services.suggestion_service import create_suggestion

STREAM_KEY = "jotai:events"
GROUP_NAME = "python_runner_group"
CONSUMER_NAME = "runner_worker_1"

_client_instance = None
_client_lock = threading.Lock()
_consumer_thread = None


def _client():
    global _client_instance
    with _client_lock:
        if _client_instance is None:
            _client_instance = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        return _client_instance


def close_client() -> None:
    """Close the shared Redis client; safe to call more than once."""
    global _client_instance
    with _client_lock:
        client = _client_instance
        _client_instance = None
    if client is not None:
        client.close()


def setup_stream(client) -> None:
    try:
        client.xgroup_create(STREAM_KEY, GROUP_NAME, id="0", mkstream=True)
        print(f"[Redis Consumer] Created consumer group {GROUP_NAME}")
    except redis.exceptions.ResponseError as exc:
        if "BUSYGROUP" not in str(exc):
            print(f"[Redis Consumer] Error creating group: {exc}")


def handle_event(event_id: str, event_data: dict) -> None:
    try:
        payload_str = event_data.get("payload")
        if not payload_str:
            return
        event = json.loads(payload_str)
        event_type = event.get("eventType")

        print(f"[Redis Consumer] Processing event: {event_type} ({event_id})")

        if event_type == "TASK_COMPLETED":
            context = get_aggregated_context()
            tasks_remaining = context.get("today", {}).get("tasks_remaining", 0)
            if tasks_remaining == 0:
                create_suggestion(
                    type="all_tasks_completed",
                    priority="low",
                    title="Amazing job today!",
                    message="You've completed all your tasks for today. Would you like me to draft tomorrow's schedule?",
                    targetModule="today",
                    actions=["plan_tomorrow"],
                )
    except Exception as exc:
        print(f"[Redis Consumer] Error handling event: {exc}")


def consumer_loop(stop_event: threading.Event) -> None:
    client = _client()
    try:
        setup_stream(client)
        print("[Redis Consumer] Listening for events...")
        while not stop_event.is_set():
            try:
                messages = client.xreadgroup(
                    GROUP_NAME, CONSUMER_NAME, {STREAM_KEY: ">"}, count=5, block=2000
                )
                if messages:
                    for _, msg_list in messages:
                        for msg_id, msg_data in msg_list:
                            handle_event(msg_id, msg_data)
                            client.xack(STREAM_KEY, GROUP_NAME, msg_id)
            except Exception as exc:
                print(f"[Redis Consumer] Loop error: {exc}")
                time.sleep(2)
    finally:
        close_client()


def start_consumer() -> threading.Event:
    global _consumer_thread
    stop_event = threading.Event()
    thread = threading.Thread(target=consumer_loop, args=(stop_event,), daemon=True)
    thread.start()
    _consumer_thread = thread
    return stop_event


def stop_consumer(stop_event: threading.Event) -> None:
    """Signal the loop and release its Redis client and thread."""
    global _consumer_thread
    stop_event.set()
    close_client()
    thread = _consumer_thread
    _consumer_thread = None
    if thread is not None and thread is not threading.current_thread():
        thread.join(timeout=5)
