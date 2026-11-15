
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { globalSearch } = require("../controllers/searchController");

// All search routes require authentication
router.use(protect);

// GET /api/search?query=keyword
router.get("/", globalSearch);

module.exports = router;
