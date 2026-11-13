import json
from datetime import date
from typing import Dict, Any
from llm_provider import get_llm_provider
from services.context_engine import get_aggregated_context
from agents.tools import (
    create_task, complete_task, delete_task,
    create_goal, delete_goal,
    create_habit, delete_habit,
)
from config import settings


def run_orchestrator(intent: str, user_id: str = "local_user") -> Dict[str, Any]:
    """
    Orchestrator takes an intent (natural language) and routes to the correct agent
    or uses function calling to interact directly with the Action Registry.
    """
    try:
        # 1. Gather Context
        context_data = get_aggregated_context()
        today_str = date.today().isoformat()

        system_prompt = f"""
You are the Jötai Smart Assistant, a highly capable and concise productivity and focus companion.
Your goal is to help the user manage their tasks, build habits, achieve goals, and optimize their schedule.

Today's date: {today_str}

Current System Context:
{json.dumps(context_data, indent=2)}

--- DOMAIN DEFINITIONS ---
Use these definitions to decide which tool to call:

TASK — A one-time, completable action with a clear done condition.
  Use `create_task` when the user wants to do something specific, usually once.
  Examples: "Buy groceries", "Send report to manager", "Read chapter 3 tonight"
  → If no due date is mentioned, default to today.

GOAL — A measurable outcome or milestone the user wants to achieve over days/weeks/months.
  Use `create_goal` when the user describes an ambition or result they're working toward.
  Goals are NOT recurring behaviors. Goals appear in "Daily Quests" on the dashboard.
  Examples: "Run a marathon by December", "Complete Python course", "Save $5000 this year"

HABIT — A recurring behavior the user wants to build into their routine.
  Use `create_habit` when the user describes something they want to do on a schedule.
  Habits track streaks and appear in the Habits view.
  Examples: "Meditate every morning", "Exercise 3 times a week", "Read 20 pages before bed"
  frequency_type options: "every_day", "weekdays", "weekends"

--- OPERATION GUIDELINES ---
- Keep conversational responses very concise (1-3 sentences max).
- If the user asks to add/create something, classify it as task, goal, or habit using the domain definitions above.
- If the user asks to complete a task, use `complete_task`.
- If the user asks to delete a task/goal/habit, use the appropriate delete tool. These require confirmation.
- Do NOT invent IDs. If the user doesn't specify which item to complete or delete, ask them to clarify.
- Do NOT use `delete_task` to mark a task as done — use `complete_task` for that.
- Do NOT use `delete_habit` to mark a habit as done for today — that is a separate operation not yet supported.
"""

        # 2. Get LLM Provider
        llm = get_llm_provider()

        # 3. Call LLM with all 7 tools
        prompt = f"{system_prompt}\n\nUser Request: {intent}"
        available_tools = [
            create_task, complete_task, delete_task,
            create_goal, delete_goal,
            create_habit, delete_habit,
        ]

        response = llm.generate(prompt, tools=available_tools)

        # 4. Handle Tool Calls
        if response.tool_calls:
            # Handle the first tool call
            tool_call = response.tool_calls[0]
            function_name = tool_call.name
            args = tool_call.args

            action_result = None

            # Route to the correct tool function
            if function_name == "create_task":
                action_result = create_task(
                    title=args.get("title", ""),
                    due_date=args.get("due_date", "")
                )
            elif function_name == "complete_task":
                action_result = complete_task(task_id=args.get("task_id", ""))
            elif function_name == "delete_task":
                action_result = delete_task(task_id=args.get("task_id", ""))
            elif function_name == "create_goal":
                action_result = create_goal(
                    title=args.get("title", ""),
                    description=args.get("description", "")
                )
            elif function_name == "delete_goal":
                action_result = delete_goal(goal_id=args.get("goal_id", ""))
            elif function_name == "create_habit":
                action_result = create_habit(
                    name=args.get("name", ""),
                    frequency_type=args.get("frequency_type", "every_day")
                )
            elif function_name == "delete_habit":
                action_result = delete_habit(habit_id=args.get("habit_id", ""))

            # Check if confirmation is required before executing
            if action_result and action_result.get("confirmationRequired"):
                return {
                    "success": True,
                    "data": {
                        "reply": action_result.get("message", "Are you sure you want to proceed?"),
                        "actionResult": action_result
                    }
                }

            # 5. Determine whether to generate a static confirmation or use LLM narration
            routine_actions = {"create_task", "complete_task", "delete_task", "create_goal", "delete_goal", "create_habit", "delete_habit"}
            is_success = action_result.get("success", False) if action_result else False

            if function_name in routine_actions:
                if is_success:
                    reply_message = f"Action completed: {function_name.replace('_', ' ').title()}."
                    if function_name == "create_task":
                        reply_message = f"Got it. I've added the task: '{args.get('title')}'."
                    elif function_name == "complete_task":
                        reply_message = f"Task completed."
                    elif function_name == "delete_task":
                        reply_message = f"Task deleted."
                    elif function_name == "create_goal":
                        reply_message = f"Goal created: '{args.get('title')}'."
                    elif function_name == "delete_goal":
                        reply_message = f"Goal deleted."
                    elif function_name == "create_habit":
                        reply_message = f"Habit '{args.get('name')}' created successfully."
                    elif function_name == "delete_habit":
                        reply_message = f"Habit deleted."
                    
                    return {
                        "success": True,
                        "data": {
                            "reply": reply_message,
                            "actionResult": action_result
                        }
                    }
                else:
                    error_msg = action_result.get("message", "An error occurred.")
                    return {
                        "success": False,
                        "data": {
                            "reply": f"Sorry, I couldn't do that: {error_msg}",
                            "actionResult": action_result
                        }
                    }

            # 6. Re-prompt LLM for non-trivial outcomes that require natural language narration
            tool_feedback_prompt = f"""
{system_prompt}

User Request: {intent}

You decided to call the tool `{function_name}` with arguments: {json.dumps(args, indent=2)}.
The backend executed this action and returned:
{json.dumps(action_result, indent=2)}

Please write a concise, natural language response to the user summarizing what happened.
If it succeeded, confirm it briefly. If it failed, explain what went wrong simply.
"""
            final_response = llm.generate(tool_feedback_prompt)

            return {
                "success": is_success,
                "data": {
                    "reply": final_response.content,
                    "actionResult": action_result
                }
            }

        else:
            # No tool called — conversational reply
            return {
                "success": True,
                "data": {
                    "reply": response.content
                }
            }

    except Exception as e:
        print(f"Orchestrator error: {e}")
        return {
            "success": False,
            "data": {
                "reply": "I encountered an internal error while processing your request."
            }
        }
