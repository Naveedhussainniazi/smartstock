const express = require("express");
const router = express.Router();

const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
} = require("../controllers/supplierController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

router.use(protect);

// Get all suppliers
router.get("/", getSuppliers);

// Get single supplier
router.get("/:id", getSupplierById);

// Admin-only operations
router.post("/", authorize("admin"), createSupplier);
router.put("/:id", authorize("admin"), updateSupplier);
router.delete("/:id", authorize("admin"), deleteSupplier);

module.exports = router;