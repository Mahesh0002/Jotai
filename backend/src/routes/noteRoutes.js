const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

// --- Notes ---
router.post('/', noteController.createNote);
router.get('/', noteController.getNotes);
router.patch('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

// --- Folders ---
router.post('/folders', noteController.createFolder);
router.get('/folders', noteController.getFolders);
router.delete('/folders/:id', noteController.deleteFolder);

// --- Tags ---
router.post('/tags', noteController.createTag);
router.get('/tags', noteController.getTags);
router.delete('/tags/:id', noteController.deleteTag);

module.exports = router;
