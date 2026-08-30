const express = require('express');
const router = express.Router();

// Example route for test
router.get('/', (req, res) => {
  res.json({ message: 'Test route is working' });
});

module.exports = router;
