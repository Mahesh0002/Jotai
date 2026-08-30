const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    try {
        const { symbol } = req.query;
        const apiKey = process.env.TWELVE_DATA_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ message: 'Twelve Data API key not configured' });
        }

        if (!symbol) {
            return res.status(400).json({ message: 'Symbol parameter is required' });
        }

        const response = await axios.get(
            `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&apikey=${apiKey}`
        );

        res.json(response.data);
    } catch (error) {
        console.error('Stock API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error fetching stock data' });
    }
});

module.exports = router;
