const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

// --- Static routes must precede /:id so they are not swallowed by it ---
router.get('/search', noteController.searchNotes);
router.post('/search/vector', noteController.mergeVectorSearch);
router.get('/folders', noteController.getFolders);
router.post('/folders', noteController.createFolder);
router.delete('/folders/:id', noteController.deleteFolder);
router.get('/tags', noteController.getTags);
router.post('/tags', noteController.createTag);
router.delete('/tags/:id', noteController.deleteTag);

// --- Notes ---
router.post('/', noteController.createNote);
router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNote);
router.patch('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
