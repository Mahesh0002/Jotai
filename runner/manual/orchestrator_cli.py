from dotenv import load_dotenv
load_dotenv()
from runner.agents.orchestrator import run_orchestrator

if __name__ == "__main__":
    import sys
    intent = sys.argv[1] if len(sys.argv) > 1 else "add goal Yoga 20 minutes"
    print(f"Testing Intent: {intent}")
    result = run_orchestrator(intent)
    print("Result:")
    import json
    print(json.dumps(result, indent=2))
