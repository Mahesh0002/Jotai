const express = require("express");
const router = express.Router(); // Initialize router

// Define routes
router.get("/", (req, res) => {
    res.json({ message: "Test route working!" });
});

router.get("/hello", (req, res) => {
    res.json({ message: "Hello from test route!" });
});

// Export the router
module.exports = router;
sasddsse
