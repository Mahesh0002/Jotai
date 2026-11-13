const express = require('express');
const { getContext, createSuggestion, getSuggestions, updateSuggestionStatus } = require('../controllers/assistantController');
const serviceAuth = require('../middlewares/serviceAuth');

const router = express.Router();

// Apply serviceAuth so the Python Runner can access these endpoints
router.use(serviceAuth);

router.get('/context', getContext);
router.post('/suggestions', createSuggestion);
router.get('/suggestions', getSuggestions);
router.post('/suggestions/:id/:action', updateSuggestionStatus);

module.exports = router;
