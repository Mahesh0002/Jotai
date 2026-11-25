const express = require('express');
const {
  getContext,
  createSuggestion,
  getSuggestions,
  updateSuggestionStatus
} = require('../controllers/assistantController');
const serviceAuth = require('../middlewares/serviceAuth');

const router = express.Router();

// Runner-only writes and context snapshot.
router.get('/context', serviceAuth, getContext);
router.post('/suggestions', serviceAuth, createSuggestion);

// Local UI routes.
router.get('/suggestions', getSuggestions);
router.post('/suggestions/:id/:action', updateSuggestionStatus);

module.exports = router;
