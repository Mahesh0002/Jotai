const express = require('express');
const router = express.Router();
const Preference = require('../models/Preference');

// GET preferences
router.get('/', async (req, res) => {
    try {
        let preference = await Preference.findOne();
        if (!preference) {
            preference = new Preference();
            await preference.save();
        }
        res.json(preference);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT update preferences
router.put('/', async (req, res) => {
    try {
        let preference = await Preference.findOne();
        if (!preference) {
            preference = new Preference();
        }

        if (req.body.integrations) {
            preference.integrations = { ...preference.integrations, ...req.body.integrations };
        }
        if (req.body.theme) preference.theme = req.body.theme;
        if (typeof req.body.calendarIcsUrl === 'string') {
            preference.calendarIcsUrl = req.body.calendarIcsUrl;
        }
        if (req.body.settings && typeof req.body.settings === 'object') {
            preference.settings = { ...(preference.settings || {}), ...req.body.settings };
        }

        preference.updatedAt = Date.now();

        const updatedPreference = await preference.save();
        res.json(updatedPreference);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
