const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');

// GET all goals
router.get('/', async (req, res) => {
    try {
        const goals = await Goal.find().sort({ createdAt: -1 });
        res.json(goals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create goal
router.post('/', async (req, res) => {
    const goal = new Goal({
        title: req.body.title,
        description: req.body.description
    });

    try {
        const newGoal = await goal.save();
        res.status(201).json(newGoal);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update goal
router.put('/:id', async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        if (req.body.title != null) goal.title = req.body.title;
        if (req.body.description != null) goal.description = req.body.description;
        if (req.body.completed != null) goal.completed = req.body.completed;
        if (req.body.progress != null) goal.progress = req.body.progress;

        const updatedGoal = await goal.save();
        res.json(updatedGoal);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE delete goal
router.delete('/:id', async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        await goal.deleteOne();
        res.json({ message: 'Goal deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
