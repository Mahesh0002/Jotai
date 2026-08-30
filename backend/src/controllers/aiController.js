const aiService = require('../services/aiService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const axios = require('axios');

const chat = async (req, res, next) => {
  try {
    // If the frontend is sending the raw Gemini payload with 'contents' and 'tools',
    // we use the proxy method to ensure compatibility with their SmartAssistant function.
    if (req.body.contents) {
      const data = await aiService.agenticChat(req.body);
      return res.json(data); // Send raw data to match frontend expectations
    }

    // Otherwise, handle a standard string prompt
    const { prompt, context } = req.body;
    if (!prompt) {
      throw new ApiError(400, 'Prompt is required');
    }
    
    const reply = await aiService.chat(prompt, context);
    res.status(200).json(new ApiResponse(200, { reply }, 'AI response generated'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

const tts = async (req, res, next) => {
  try {
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    if (!DEEPGRAM_API_KEY) {
      throw new ApiError(500, 'Deepgram API key not configured');
    }

    const response = await axios.post(
      'https://api.deepgram.com/v1/speak?model=aura-asteria-en',
      req.body,
      {
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error) {
    next(new ApiError(500, 'Error generating audio'));
  }
};

module.exports = {
  chat,
  tts
};
