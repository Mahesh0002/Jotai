const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(config.geminiApiKey || 'dummy_key_if_not_provided');

const chat = async (prompt, systemContext = '') => {
  if (!config.geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  // We use gemini-1.5-flash or 1.5-pro, which supports system instructions and tools.
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    systemInstruction: systemContext || 'You are Jotai\'s Smart Assistant.',
  });

  const result = await model.generateContent(prompt);

  const response = result.response;
  return response.text();
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${config.geminiApiKey}`,
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
