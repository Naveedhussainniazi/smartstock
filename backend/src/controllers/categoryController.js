
const Category = require("../models/Category");

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      res.status(400);
      throw new Error("Category name is required");
    }

    const existingCategory = await Category.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      res.status(400);
      throw new Error("Category already exists");
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || "",
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const category = await Category.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    if (name !== undefined) {
      if (!name.trim()) {
        res.status(400);
        throw new Error("Category name cannot be empty");
      }

      const existingCategory = await Category.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id },
      });

      if (existingCategory) {
        res.status(400);
        throw new Error("Category name already exists");
      }

      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description;
    }

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category (soft delete)
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
