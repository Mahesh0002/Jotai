const FocusBlock = require('../models/FocusBlock');
const Task = require('../models/Task');

// Get blocks for a specific date range
exports.getBlocks = async (req, res) => {
  try {
    const { start, end } = req.query;
    let query = {};
    
    if (start && end) {
      query = {
        startTime: { $gte: new Date(start) },
        endTime: { $lte: new Date(end) }
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query = {
        startTime: { $gte: today, $lt: tomorrow }
      };
    }

    const blocks = await FocusBlock.find(query)
      .populate('taskId', 'title priority projectId tags isStarred xpReward estimatedMinutes')
      .sort({ startTime: 1 });
      
    res.status(200).json({ success: true, count: blocks.length, data: blocks });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Create a new block
exports.createBlock = async (req, res) => {
  try {
    const block = await FocusBlock.create(req.body);
    const populatedBlock = await FocusBlock.findById(block._id).populate('taskId');
    res.status(201).json({ success: true, data: populatedBlock });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update a block (resize, move, edit)
exports.updateBlock = async (req, res) => {
  try {
    const block = await FocusBlock.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('taskId');

    if (!block) {
      return res.status(404).json({ success: false, error: 'Block not found' });
    }

    res.status(200).json({ success: true, data: block });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete a block
exports.deleteBlock = async (req, res) => {
  try {
    const block = await FocusBlock.findByIdAndDelete(req.params.id);

    if (!block) {
      return res.status(404).json({ success: false, error: 'Block not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Complete a block and optionally complete task
exports.completeBlock = async (req, res) => {
  try {
    const { completeTask, elapsedSeconds, pausedSeconds, distractions, notes } = req.body;
    
    const block = await FocusBlock.findById(req.params.id).populate('taskId');
    if (!block) {
      return res.status(404).json({ success: false, error: 'Block not found' });
    }

    block.status = 'completed';
    
    // Update session data
    if (elapsedSeconds !== undefined) block.elapsedSeconds = elapsedSeconds;
    if (pausedSeconds !== undefined) block.pausedSeconds = pausedSeconds;
    if (notes !== undefined) block.notes = notes;
    if (distractions !== undefined) block.distractions = distractions;

    // Calculate actual focused minutes
    // Total elapsed minus paused minus sum of distraction durations (if we assume distractions aren't already included in paused)
    const totalDistractionSeconds = (distractions || []).reduce((acc, d) => acc + (d.duration || 0), 0);
    const focusedSeconds = (block.elapsedSeconds || 0) - (block.pausedSeconds || 0) - totalDistractionSeconds;
    const focusedMinutes = Math.max(0, Math.floor(focusedSeconds / 60));

    // Calculate simple XP based on actual focused duration (1 XP per minute as baseline)
    block.xpReward = focusedMinutes > 0 ? focusedMinutes : 0;
    
    await block.save();

    let updatedTask = null;
    if (completeTask && block.taskId) {
      const task = await Task.findById(block.taskId._id);
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date();
        // optionally add focus time to task
        await task.save();
        updatedTask = task;
      }
    }

    res.status(200).json({ 
      success: true, 
      data: block,
      task: updatedTask,
      xpAwarded: block.xpReward
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
