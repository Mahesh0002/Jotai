const express = require('express');
const router = express.Router();
const axios = require('axios');

// Proxy for Gemini Chat
router.post('/chat', async (req, res) => {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ message: 'Gemini API key not configured' });
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            req.body,
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error communicating with Gemini' });
    }
});

// Proxy for Deepgram TTS
router.post('/tts', async (req, res) => {
    try {
        const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
        if (!DEEPGRAM_API_KEY) {
            return res.status(500).json({ message: 'Deepgram API key not configured' });
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
        console.error('Deepgram TTS Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ message: 'Error generating audio' });
    }
});

module.exports = router;
