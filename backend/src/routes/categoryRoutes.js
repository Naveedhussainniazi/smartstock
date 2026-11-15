
const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// All category routes require authentication
router.use(protect);

// Create category (Admin + Staff)
router.post("/", createCategory);

// Read categories (Admin + Staff)
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Update category (Admin only)
router.put("/:id", authorize("admin"), updateCategory);

// Delete category (Admin only)
router.delete("/:id", authorize("admin"), deleteCategory);

module.exports = router;
