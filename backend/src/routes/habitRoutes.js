const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');

// GET all habits
router.get('/', async (req, res) => {
    try {
        const habits = await Habit.find().sort({ createdAt: -1 });
        res.json(habits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create habit
router.post('/', async (req, res) => {
    const habit = new Habit({
        text: req.body.text,
        frequency: req.body.frequency,
        goalId: req.body.goalId
    });

    try {
        const newHabit = await habit.save();
        res.status(201).json(newHabit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update habit
router.put('/:id', async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) return res.status(404).json({ message: 'Habit not found' });

        if (req.body.text != null) habit.text = req.body.text;
        if (req.body.frequency != null) habit.frequency = req.body.frequency;
        if (req.body.completed != null) habit.completed = req.body.completed;

        const updatedHabit = await habit.save();
        res.json(updatedHabit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE delete habit
router.delete('/:id', async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) return res.status(404).json({ message: 'Habit not found' });

        await habit.deleteOne();
        res.json({ message: 'Habit deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
