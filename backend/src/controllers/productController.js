
const mongoose = require("mongoose");
const Product = require("../models/Product");
require("../models/Category");

// CREATE PRODUCT
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL PRODUCTS

const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      category,
      stockStatus
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

    const filter = { isActive: true };

    // Search by product name or SKU
    if (search && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { sku: { $regex: safeSearch, $options: "i" } }
      ];
    }

    // Filter by category
    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID"
        });
      }

      filter.category = category;
    }

    // Low stock products
    if (stockStatus === "low") {
      filter.$expr = {
        $and: [
          { $gt: ["$quantity", 0] },
          { $lte: ["$quantity", "$minStockLevel"] }
        ]
      };
    }

    // Out of stock products
    if (stockStatus === "out") {
      filter.quantity = 0;
    }

    const totalInDatabase = await Product.countDocuments();
const activeProducts = await Product.countDocuments({ isActive: true });


const allProducts = await Product.find({});


    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1, _id: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    res.status(200).json({
      success: true,
      totalProducts,
      currentPage: pageNumber,
      pageSize,
      totalPages: Math.ceil(totalProducts / pageSize),
      count: products.length,
      data: products
    });

  } catch (error) {
    next(error);
  }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("category", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        isActive: true,
      },
      { $set: req.body },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// SOFT DELETE PRODUCT
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        isActive: true,
      },
      { $set: { isActive: false } },
      { returnDocument: "after" }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
