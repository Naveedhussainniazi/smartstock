
const mongoose = require("mongoose");

const StockMovement = require("../models/StockMovement");
const Product = require("../models/Product");

// Register models used by StockMovement.refPath
require("../models/Purchase");
require("../models/Sale");
require("../models/StockAdjustment");

// GET ALL STOCK MOVEMENTS
const getStockMovements = async (req, res, next) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const { productName, type } = req.query;
    const filter = {};

    // PRODUCT NAME SEARCH (case-insensitive, partial match)
    if (productName && productName.trim()) {
      const escapedName = productName.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const matchingProductIds = await Product.find({
        name: {
          $regex: escapedName,
          $options: "i"
        }
      }).distinct("_id");

      // No matching products found
      if (matchingProductIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            totalMovements: 0,
            currentPage: page,
            totalPages: 0,
            limit,
            hasNextPage: false,
            hasPreviousPage: false
          }
        });
      }

      filter.product = { $in: matchingProductIds };
    }

    // MOVEMENT TYPE FILTER
    if (type) {
      const allowedTypes = [
        "purchase",
        "sale",
        "adjustment",
        "return"
      ];

      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid stock movement type"
        });
      }

      filter.type = type;
    }

    const skip = (page - 1) * limit;

    const [movements, totalMovements] = await Promise.all([
      StockMovement.find(filter)
        .populate("product", "name sku quantity unit")
        .populate("createdBy", "name email")
        .populate("referenceId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      StockMovement.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: movements,
      pagination: {
        totalMovements,
        currentPage: page,
        totalPages: Math.ceil(totalMovements / limit),
        limit,
        hasNextPage: page * limit < totalMovements,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET STOCK HISTORY FOR ONE PRODUCT
const getProductStockHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true
    }).select("name sku quantity unit");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive"
      });
    }

    const movements = await StockMovement.find({
      product: id
    })
      .populate("createdBy", "name email")
      .populate("referenceId")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Product stock history retrieved successfully",
      data: {
        product,
        totalMovements: movements.length,
        movements
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockMovements,
  getProductStockHistory
};
