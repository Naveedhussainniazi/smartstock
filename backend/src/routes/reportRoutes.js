const express = require("express");
const router = express.Router();

const {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getLowStockReport,
  getTopSellingProducts,
  getCategorySalesReport
} = require("../controllers/reportController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("admin"));

router.get("/sales", getSalesReport);
router.get("/purchases", getPurchaseReport);
router.get("/inventory", getInventoryReport);
router.get("/low-stock", getLowStockReport);
router.get("/top-selling-products", getTopSellingProducts);
router.get("/category-sales", getCategorySalesReport);

module.exports = router;