import time
import json
import redis
import threading
from config import settings
from services.context_engine import get_aggregated_context
from services.suggestion_service import create_suggestion

# Initialize Redis
r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

STREAM_KEY = 'jotai:events'
GROUP_NAME = 'python_runner_group'
CONSUMER_NAME = 'runner_worker_1'

def setup_stream():
    try:
        r.xgroup_create(STREAM_KEY, GROUP_NAME, id='0', mkstream=True)
        print(f"[Redis Consumer] Created consumer group {GROUP_NAME}")
    except redis.exceptions.ResponseError as e:
        if "BUSYGROUP Consumer Group name already exists" not in str(e):
            print(f"[Redis Consumer] Error creating group: {e}")

def handle_event(event_id, event_data):
    try:
        payload_str = event_data.get('payload')
        if not payload_str:
            return
            
        event = json.loads(payload_str)
        event_type = event.get('eventType')
        data = event.get('data', {})
        
        print(f"[Redis Consumer] Processing event: {event_type} ({event_id})")
        
        # Example Proactive Intelligence Logic
        if event_type == 'TASK_COMPLETED':
            # 1. Fetch updated context
            context = get_aggregated_context()
            tasks_remaining = context.get('today', {}).get('tasks_remaining', 0)
            
            # 2. Decide if we want to create a suggestion
            if tasks_remaining == 0:
                create_suggestion(
                    type="all_tasks_completed",
                    priority="low",
                    title="Amazing job today!",
                    message="You've completed all your tasks for today. Would you like me to draft tomorrow's schedule?",
                    targetModule="today",
                    actions=["plan_tomorrow"]
                )
                
    except Exception as e:
        print(f"[Redis Consumer] Error handling event: {e}")

def consumer_loop(stop_event):
    setup_stream()
    
    print("[Redis Consumer] Listening for events...")
    while not stop_event.is_set():
        try:
            # Read from stream
            # '>' means messages not delivered to other consumers in group
            messages = r.xreadgroup(GROUP_NAME, CONSUMER_NAME, {STREAM_KEY: '>'}, count=5, block=2000)
            
            if messages:
                for stream, msg_list in messages:
                    for msg_id, msg_data in msg_list:
                        handle_event(msg_id, msg_data)
                        # Acknowledge successful processing
                        r.xack(STREAM_KEY, GROUP_NAME, msg_id)
                        
        except Exception as e:
            print(f"[Redis Consumer] Loop error: {e}")
            time.sleep(2) # Backoff before retry

def start_consumer():
    stop_event = threading.Event()
    thread = threading.Thread(target=consumer_loop, args=(stop_event,), daemon=True)
    thread.start()
    return stop_event
