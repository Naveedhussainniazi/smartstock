
const express = require("express");
const router = express.Router();


const {
    createStockAdjustment,
    getStockAdjustments,
    getStockAdjustmentById
} = require("../controllers/stockAdjustmentController");



const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const validate = require("../middleware/validate");

const {
  stockAdjustmentSchema
} = require("../validators/stockAdjustmentValidator");

// Protect all routes
router.use(protect);

// Only admin can adjust stock
router.use(authorize("admin"));

// Get stock adjustments with optional filters and pagination
router.get("/", getStockAdjustments);

// Create stock adjustment
router.post(
  "/",
  validate(stockAdjustmentSchema),
  createStockAdjustment
);

// Get stock adjustment by ID
router.get("/:id", getStockAdjustmentById);

module.exports = router;
