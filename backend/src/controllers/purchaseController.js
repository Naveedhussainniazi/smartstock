const crypto = require("crypto");

const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
require("../models/User");

const mongoose = require("mongoose");
const StockMovement = require("../models/StockMovement");

// CREATE PURCHASE
const createPurchase = async (req, res, next) => {
  try {
    const { supplier, items, taxRate } = req.body;

    const supplierExists = await Supplier.findOne({
      _id: supplier,
      isActive: true,
    });

    if (!supplierExists) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found or inactive",
      });
    }

    const productIds = items.map((item) => item.product);

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });

    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products are missing or inactive",
      });
    }

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    const purchaseItems = items.map((item) => {
      const product = productMap.get(item.product);

      return {
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitCost: item.unitCost,
        lineTotal: roundMoney(item.quantity * item.unitCost),
      };
    });

    const subtotal = roundMoney(
      purchaseItems.reduce((total, item) => total + item.lineTotal, 0),
    );

    const finalTaxRate = taxRate ?? 0;
    const taxAmount = roundMoney((subtotal * finalTaxRate) / 100);
    const grandTotal = roundMoney(subtotal + taxAmount);

    const invoiceNumber = `PUR-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const purchase = await Purchase.create({
      invoiceNumber,
      supplier: supplierExists._id,
      items: purchaseItems,
      subtotal,
      taxRate: finalTaxRate,
      taxAmount,
      grandTotal,
      status: "draft",
      createdBy: req.user._id,
    });

    const result = await Purchase.findById(purchase._id)
      .populate("supplier", "name company phone")
      .populate("items.product", "name sku");

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL PURCHASES WITH SEARCH AND PAGINATION
const getPurchases = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );

    const { status, search } = req.query;

    const filter = {};

    if (status) {
      const allowedStatuses = ["draft", "received", "cancelled"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid purchase status",
        });
      }

      filter.status = status;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.invoiceNumber = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    const totalPurchases = await Purchase.countDocuments(filter);

    const purchases = await Purchase.find(filter)
      .populate("supplier", "name company phone")
      .populate("items.product", "name sku")
      .populate("createdBy", "name email")
      .populate("receivedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: purchases,
      pagination: {
        totalPurchases,
        currentPage: page,
        totalPages: Math.ceil(totalPurchases / limit),
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE PURCHASE DETAILS
const getPurchaseById = async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID",
      });
    }

    const purchase = await Purchase.findById(req.params.id)
      .populate("supplier", "name company phone email")
      .populate("items.product", "name sku")
      .populate("createdBy", "name email")
      .populate("receivedBy", "name email");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

// CANCEL DRAFT PURCHASE
const cancelPurchase = async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID",
      });
    }

    const purchase = await Purchase.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "draft",
      },
      {
        $set: { status: "cancelled" },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .populate("supplier", "name company phone")
      .populate("items.product", "name sku");

    if (!purchase) {
      const existingPurchase = await Purchase.findById(req.params.id);

      if (!existingPurchase) {
        return res.status(404).json({
          success: false,
          message: "Purchase not found",
        });
      }

      return res.status(409).json({
        success: false,
        message: `Cannot cancel purchase with status: ${existingPurchase.status}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Purchase cancelled successfully",
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// RECEIVE PURCHASE AND UPDATE STOCK
const receivePurchase = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID",
      });
    }

    await session.withTransaction(async () => {
      // 1. Find a draft purchase
      const purchase = await Purchase.findOne({
        _id: id,
        status: "draft",
      }).session(session);

      if (!purchase) {
        const existing = await Purchase.findById(id).session(session);

        const error = new Error(
          existing
            ? `Purchase cannot be received. Current status: ${existing.status}`
            : "Purchase not found",
        );

        error.statusCode = existing ? 409 : 404;
        throw error;
      }

      const movements = [];

      // 2. Add purchased quantity to each product
      for (const item of purchase.items) {
        const product = await Product.findOneAndUpdate(
          {
            _id: item.product,
            isActive: true,
          },
          {
            $inc: { quantity: item.quantity },
          },
          {
            returnDocument: "before",
            session,
            runValidators: true,
          },
        );

        if (!product) {
          const error = new Error(
            `Product not found or inactive: ${item.name}`,
          );
          error.statusCode = 409;
          throw error;
        }

        const previousQuantity = product.quantity || 0;
        const newQuantity = previousQuantity + item.quantity;

        // 3. Prepare stock movement history
        movements.push({
          product: product._id,
          type: "purchase",
          referenceModel: "Purchase",
          referenceId: purchase._id,
          quantity: item.quantity,
          previousQuantity,
          newQuantity,
          note: `Stock received from purchase ${purchase.invoiceNumber}`,
          createdBy: req.user._id,
        });
      }

      // 4. Save all stock movement records
      await StockMovement.insertMany(movements, { session });

      // 5. Mark purchase as received
      const updatedPurchase = await Purchase.findOneAndUpdate(
        {
          _id: id,
          status: "draft",
        },
        {
          $set: {
            status: "received",
            receivedBy: req.user._id,
            receivedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
          session,
        },
      );

      if (!updatedPurchase) {
        const error = new Error(
          "Purchase status changed. Please refresh and try again.",
        );
        error.statusCode = 409;
        throw error;
      }
    });

    // 6. Return the updated purchase after transaction commits
    const result = await Purchase.findById(id)
      .populate("supplier", "name company phone")
      .populate("items.product", "name sku quantity")
      .populate("createdBy", "name email")
      .populate("receivedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Purchase received and stock updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  cancelPurchase,
  receivePurchase,
};
