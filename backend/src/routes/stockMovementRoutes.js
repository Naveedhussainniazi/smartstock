const express = require("express");
const router = express.Router();

const {
  getStockMovements,
  getProductStockHistory
} = require("../controllers/stockMovementController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getStockMovements);
router.get("/product/:id", getProductStockHistory);

module.exports = router;