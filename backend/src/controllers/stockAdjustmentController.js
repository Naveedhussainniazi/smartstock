
const mongoose = require("mongoose");
const crypto = require("crypto");

const Product = require("../models/Product");
const StockAdjustment = require("../models/StockAdjustment");
const StockMovement = require("../models/StockMovement");

// CREATE STOCK ADJUSTMENT
const createStockAdjustment = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { product: productId, type, quantity, reason, note = "" } = req.body;

    let adjustmentId;

    await session.withTransaction(async () => {
      // Find active product and update stock atomically
      const filter = {
        _id: productId,
        isActive: true
      };

      // Prevent stock from becoming negative
      if (type === "decrease") {
        filter.quantity = { $gte: quantity };
      }

      const product = await Product.findOneAndUpdate(
        filter,
        {
          $inc: {
            quantity: type === "increase" ? quantity : -quantity
          }
        },
        {
          returnDocument: "before",
          session,
          runValidators: true
        }
      );

      if (!product) {
        const existingProduct = await Product.findById(productId).session(session);

        const error = new Error(
          !existingProduct || !existingProduct.isActive
            ? "Product not found or inactive"
            : `Insufficient stock. Available: ${existingProduct.quantity}, Required: ${quantity}`
        );

        error.statusCode = existingProduct && existingProduct.isActive ? 409 : 404;
        throw error;
      }

      const previousQuantity = product.quantity;

      const newQuantity =
        type === "increase"
          ? previousQuantity + quantity
          : previousQuantity - quantity;

      // Generate adjustment reference
      const adjustmentNumber =
        `ADJ-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      // Save adjustment record
      const [adjustment] = await StockAdjustment.create(
        [
          {
            adjustmentNumber,
            product: product._id,
            type,
            quantity,
            previousQuantity,
            newQuantity,
            reason,
            note,
            createdBy: req.user._id
          }
        ],
        { session }
      );

      // Save stock movement history
      await StockMovement.create(
        [
          {
            product: product._id,
            type: "adjustment",
            referenceModel: "StockAdjustment",
            referenceId: adjustment._id,
            quantity,
            previousQuantity,
            newQuantity,
            note: `${type.toUpperCase()}: ${reason}`,
            createdBy: req.user._id
          }
        ],
        { session }
      );

      adjustmentId = adjustment._id;
    });

    const result = await StockAdjustment.findById(adjustmentId)
      .populate("product", "name sku quantity")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Stock adjusted successfully",
      data: result
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  } finally {
    await session.endSession();
  }
};


// GET ALL STOCK ADJUSTMENTS
const getStockAdjustments = async (req, res, next) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const { product, type, search } = req.query;
    const filter = {};

    // Filter by product
    if (product) {
      if (!mongoose.isValidObjectId(product)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID"
        });
      }

      filter.product = product;
    }

    // Filter by adjustment type
    if (type) {
      if (!["increase", "decrease"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Type must be increase or decrease"
        });
      }

      filter.type = type;
    }

    // Search by adjustment number
    if (search) {
      if (search.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Search text is too long"
        });
      }

      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.adjustmentNumber = {
        $regex: escapedSearch,
        $options: "i"
      };
    }

    const skip = (page - 1) * limit;

    const [adjustments, totalAdjustments] = await Promise.all([
      StockAdjustment.find(filter)
        .populate("product", "name sku quantity")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      StockAdjustment.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: adjustments,
      pagination: {
        totalAdjustments,
        currentPage: page,
        totalPages: Math.ceil(totalAdjustments / limit),
        limit,
        hasNextPage: page * limit < totalAdjustments,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE STOCK ADJUSTMENT DETAILS
const getStockAdjustmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid adjustment ID"
      });
    }

    const adjustment = await StockAdjustment.findById(id)
      .populate("product", "name sku sellingPrice purchasePrice quantity unit")
      .populate("createdBy", "name email role")
      .lean();

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: "Stock adjustment not found"
      });
    }

    // Find corresponding stock movement
    const movement = await StockMovement.findOne({
      referenceModel: "StockAdjustment",
      referenceId: adjustment._id
    })
      .populate("createdBy", "name email")
      .lean();

    res.status(200).json({
      success: true,
      message: "Stock adjustment details retrieved successfully",
      data: {
        adjustment,
        stockMovement: movement
      }
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  createStockAdjustment,
  getStockAdjustments,
  getStockAdjustmentById
};
