const express = require("express");
const router = express.Router();

const { getDashboardOverview } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Protect dashboard routes
router.use(protect);
router.use(authorize("admin"));

// Dashboard overview
router.get("/overview", getDashboardOverview);

module.exports = router;