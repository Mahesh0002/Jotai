const proposalRepository = require('../repositories/proposalRepository');
const focusRepository = require('../repositories/focusRepository');
const calendarService = require('../services/calendarService');
const eventBus = require('../services/eventBus').eventBus;
const preferenceRepository = require('../repositories/preferenceRepository');

function extractAttributes(data) {
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { return {}; }
  }
  if (!data || typeof data !== 'object') return {};
  const attributes = {};
  const keys = ['timeOfDay', 'durationMinutes', 'focusType', 'startTime', 'endTime', 'taskId'];
  for (const key of keys) {
    if (data[key] !== undefined) attributes[key] = data[key];
  }

  const block = Array.isArray(data.blocks) ? data.blocks[0] : null;
  if (block && typeof block === 'object') {
    for (const key of ['startTime', 'endTime', 'title', 'taskId']) {
      if (block[key] !== undefined && attributes[key] === undefined) {
        attributes[key] = block[key];
      }
    }
    if (attributes.durationMinutes === undefined && block.startTime && block.endTime) {
      const minutes = (new Date(block.endTime) - new Date(block.startTime)) / 60000;
      if (Number.isFinite(minutes) && minutes > 0) attributes.durationMinutes = minutes;
    }
  }
  return attributes;
}

exports.createProposal = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const proposal = proposalRepository.create(userId, req.body);
    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

exports.getProposals = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { status } = req.query;
    const proposals = status === 'pending'
      ? proposalRepository.findPending(userId)
      : proposalRepository.findAll(userId);
    res.status(200).json({ success: true, count: proposals.length, data: proposals });
  } catch (error) {
    next(error);
  }
};

exports.updateProposalStatus = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const proposal = proposalRepository.findById(userId, id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    const previous = proposal.status;

    if (status === 'accepted') {
      proposalRepository.accept(userId, id);
    } else if (status === 'rejected') {
      proposalRepository.reject(userId, id);
    }

    // Log the decision only when the user actually accepted or rejected.
    if (status !== 'pending') {
      proposalRepository.logDecision(userId, id, proposal.type, status === 'accepted', extractAttributes(proposal.data));
    }

    // If accepting a schedule proposal, create focus blocks and write ICS
    if (status === 'accepted' && proposal.type === 'schedule_proposal') {
      try {
        const data = JSON.parse(proposal.data);
        const blocks = data.blocks || [];

        for (const block of blocks) {
          if (block.title && block.startTime && block.endTime) {
            // Check conflicts
            const conflictCheck = await calendarService.checkScheduleConstraints(userId, {
              start_time: block.startTime,
              end_time: block.endTime,
            });

            if (!conflictCheck.conflict) {
              focusRepository.create(userId, {
                title: block.title,
                task_id: block.taskId || null,
                start_time: block.startTime,
                end_time: block.endTime,
                status: 'scheduled',
                source: 'assistant',
              });
            }
          }
        }

        // Write updated ICS
        const prefs = preferenceRepository.get(userId);
        const outboundPath = prefs?.calendar_outbound_ics_path || './data/jotai-calendar.ics';
        await calendarService.writeCalendarIcs(userId, outboundPath);

        // Emit event
        eventBus.publish('SCHEDULE_UPDATED', { type: 'node', operation: 'proposal.accept' }, { proposalId: id }, userId);
      } catch (err) {
        console.error('[proposalController] Error creating focus blocks from proposal:', err.message);
      }
    }

    const updated = proposalRepository.findById(userId, id);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.getDecisionLogs = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
    const logs = proposalRepository.getDecisions(userId, limit);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

exports.extractAttributes = extractAttributes;