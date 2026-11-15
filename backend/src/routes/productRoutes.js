
const express = require("express");
const router = express.Router();

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const validate = require("../middleware/validate");

const {
  productSchema,
  updateProductSchema,
} = require("../validators/productValidator");

// All product routes require authentication
router.use(protect);

// Create Product (authenticated users)
router.post("/", validate(productSchema), createProduct);

// View Products (authenticated users)
router.get("/", getProducts);
router.get("/:id", getProductById);

// Update Product (Admin only)
router.put(
  "/:id",
  authorize("admin"),
  validate(updateProductSchema),
  updateProduct
);

// Delete Product (Admin only)
router.delete(
  "/:id",
  authorize("admin"),
  deleteProduct
);

module.exports = router;
