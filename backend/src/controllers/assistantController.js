const metricsService = require('../services/metricsService');

/**
 * GET /api/v1/assistant/context
 * Returns real aggregated context for the assistant
 */
exports.getContext = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const context = await metricsService.getContextSnapshot(userId);
    res.status(200).json({ success: true, data: context });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/assistant/suggestions
 * Create a suggestion (with dedupe)
 */
exports.createSuggestion = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { type, priority, title, message, targetModule, actions } = req.body;

    // This would use suggestionRepository but for now return mock
    // The actual implementation is in the repository
    const suggestionRepository = require('../repositories/suggestionRepository');

    const existing = suggestionRepository.findByTypeAndTarget(userId, type, targetModule);
    if (existing) {
      return res.status(200).json({ success: true, data: existing, message: 'Suggestion already exists' });
    }

    const suggestion = suggestionRepository.create(userId, {
      type, priority, title, message, targetModule, actions: actions || [],
    });

    res.status(201).json({ success: true, data: suggestion });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/assistant/suggestions
 * Get pending suggestions
 */
exports.getSuggestions = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { targetModule } = req.query;
    const suggestionRepository = require('../repositories/suggestionRepository');
    const suggestions = suggestionRepository.findPending(userId, targetModule);
    res.status(200).json({ success: true, count: suggestions.length, data: suggestions });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/assistant/suggestions/:id/:action
 * Update suggestion status
 */
exports.updateSuggestionStatus = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { id, action } = req.params;

    if (!['accept', 'dismiss', 'execute'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const suggestionRepository = require('../repositories/suggestionRepository');
    const suggestion = suggestionRepository.updateStatus(userId, id, action);

    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Suggestion not found' });
    }

    res.status(200).json({ success: true, data: suggestion });
  } catch (error) {
    next(error);
  }
};