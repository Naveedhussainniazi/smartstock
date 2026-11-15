
const express = require("express");
const router = express.Router();

const {
  createSale,
  completeSale,
  getSales,
  searchSalesByInvoice,
  getSaleById
} = require("../controllers/saleController");

const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { saleSchema } = require("../validators/saleValidator");

router.use(protect);

// Admin and Staff can access Sales
router.post("/", validate(saleSchema), createSale);

router.get("/search", searchSalesByInvoice);

router.get("/", getSales);

router.get("/:id", getSaleById);

router.patch("/:id/complete", completeSale);

module.exports = router;
