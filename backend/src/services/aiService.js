const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(config.geminiApiKey || 'dummy_key_if_not_provided');

const Goal = require('../models/Goal');

const functionDeclarations = [
  {
    name: "getPendingGoals",
    description: "Fetch the user's current pending goals/quests.",
    parameters: { type: "OBJECT", properties: {} }
  },
  {
    name: "proposeCompleteGoal",
    description: "Propose to mark a specific goal as complete. Use this when the user says they finished a goal.",
    parameters: {
      type: "OBJECT",
      properties: {
        goalId: { type: "STRING", description: "The ID of the goal to complete" },
        goalTitle: { type: "STRING", description: "The title of the goal to complete (for UI display)" }
      },
      required: ["goalId", "goalTitle"]
    }
  },
  {
    name: "proposeStartFocusTimer",
    description: "Propose starting the focus timer.",
    parameters: { type: "OBJECT", properties: {} }
  }
];

const chat = async (prompt, systemContext = '') => {
  if (!config.geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Use a valid model
  const model = genAI.getGenerativeModel({
    model: config.geminiModel,
    systemInstruction: systemContext || 'You are Jotai\'s Smart Assistant.',
    tools: [{ functionDeclarations }],
  });

  const chatSession = model.startChat({});
  let result = await chatSession.sendMessage(prompt);
  let response = result.response;

  const proposedActions = [];

  while (response.functionCalls && response.functionCalls()?.length > 0) {
    const calls = response.functionCalls();
    const functionResponses = [];

    for (const call of calls) {
      if (call.name === 'getPendingGoals') {
        const goals = await Goal.find({ status: 'active' }); // fixed: was { completed: false }
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { goals: goals.map(g => ({ id: g._id, title: g.title, description: g.description })) }
          }
        });
      } else if (call.name === 'proposeCompleteGoal') {
        const { goalId, goalTitle } = call.args;
        proposedActions.push({ type: 'COMPLETE_GOAL', payload: { goalId, goalTitle } });
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { status: "Action proposed to user for approval. Do NOT say you completed it, say you are proposing it." }
          }
        });
      } else if (call.name === 'proposeStartFocusTimer') {
        proposedActions.push({ type: 'START_TIMER', payload: {} });
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { status: "Timer start proposed to user." }
          }
        });
      }
    }

    // Send the function responses back to the model as a text string to avoid role 'function' errors
    const textFallback = functionResponses.map(fr => `Function call result for ${fr.functionResponse.name}: ${JSON.stringify(fr.functionResponse.response)}`).join('\n');
    result = await chatSession.sendMessage(textFallback);
    response = result.response;
  }

  return { reply: response.text(), proposedActions };
};

const agenticChat = async (payload) => {
  if (!config.geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  // This function assumes the payload is the raw format expected by the REST API,
  // or we can just pass it directly if we want to act as a proxy.
  // Since we are building an agentic backend, we'll keep the REST proxy 
  // for the exact frontend compatibility for now.
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Error communicating with Gemini');
  }

  return await response.json();
};

module.exports = {
  chat,
  agenticChat
};
