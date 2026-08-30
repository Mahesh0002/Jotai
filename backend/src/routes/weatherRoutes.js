const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    try {
        const { city } = req.query;
        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ message: 'Weather API key not configured' });
        }

        if (!city) {
            return res.status(400).json({ message: 'City parameter is required' });
        }

        const response = await axios.get(
            `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`
        );

        res.json(response.data);
    } catch (error) {
        console.error('Weather API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error fetching weather data' });
    }
});

module.exports = router;
