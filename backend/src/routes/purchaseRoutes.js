
const express = require("express");
const router = express.Router();

const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  cancelPurchase,
  receivePurchase
} = require("../controllers/purchaseController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const validate = require("../middleware/validate");
const { purchaseSchema } = require("../validators/purchaseValidator");

router.use(protect);
router.use(authorize("admin"));

// Create purchase
router.post("/", validate(purchaseSchema), createPurchase);

// Get all purchases
router.get("/", getPurchases);

// Get single purchase
router.get("/:id", getPurchaseById);

// Cancel draft purchase
router.patch("/:id/cancel", cancelPurchase);

// Receive purchase
router.patch("/:id/receive", receivePurchase);

module.exports = router;
