
const crypto = require("crypto");

const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

// CREATE SALES INVOICE
const mongoose = require("mongoose");
const StockMovement = require("../models/StockMovement");

// CREATE SALES INVOICE
const createSale = async (req, res, next) => {
  try {
    const {
      customer,
      customerName,
      items,
      discount = 0,
      taxRate = 0,
      paymentMethod = "cash",
      paymentStatus = "paid"
    } = req.body;

    // 1. Check customer
    let customerExists = null;

    if (customer) {
      customerExists = await Customer.findOne({
        _id: customer,
        isActive: true
      });

      if (!customerExists) {
        return res.status(404).json({
          success: false,
          message: "Customer not found or inactive"
        });
      }
    }

    // 2. Find active products
    const productIds = items.map(item => item.product);

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    });

    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products are missing or inactive"
      });
    }

    // 3. Prepare invoice items using database prices
    const productMap = new Map(
      products.map(product => [
        product._id.toString(),
        product
      ])
    );

    const saleItems = items.map(item => {
      const product = productMap.get(item.product);

      const unitPrice = product.sellingPrice;
      const lineTotal = roundMoney(item.quantity * unitPrice);

      return {
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        lineTotal
      };
    });

    // 4. Calculate invoice totals
    const subtotal = roundMoney(
      saleItems.reduce(
        (total, item) => total + item.lineTotal,
        0
      )
    );

    if (discount > subtotal) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot exceed subtotal"
      });
    }

    const taxableAmount = roundMoney(subtotal - discount);

    const taxAmount = roundMoney(
      taxableAmount * taxRate / 100
    );

    const grandTotal = roundMoney(
      taxableAmount + taxAmount
    );

    // 5. Generate invoice number
    const invoiceNumber =
      `SAL-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // 6. Create draft sale
    const sale = await Sale.create({
      invoiceNumber,
      customer: customerExists?._id || null,
      customerName:
        customerExists?.name || customerName || "Walk-in Customer",
      items: saleItems,
      subtotal,
      discount,
      taxRate,
      taxAmount,
      grandTotal,
      paymentMethod,
      paymentStatus,
      status: "draft",
      createdBy: req.user._id
    });

    // 7. Return populated invoice
    const result = await Sale.findById(sale._id)
      .populate("customer", "name phone email")
      .populate("items.product", "name sku sellingPrice quantity")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Sales invoice created successfully",
      data: result
    });

  } catch (error) {
    next(error);
  }
};

const roundMoney = value =>
  Math.round((value + Number.EPSILON) * 100) / 100;


// COMPLETE SALE AND DEDUCT STOCK
const completeSale = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID"
      });
    }

    await session.withTransaction(async () => {

      // 1. Find draft sale
      const sale = await Sale.findOne({
        _id: id,
        status: "draft"
      }).session(session);

      if (!sale) {
        const existingSale = await Sale.findById(id).session(session);

        const error = new Error(
          existingSale
            ? `Sale cannot be completed. Current status: ${existingSale.status}`
            : "Sale not found"
        );

        error.statusCode = existingSale ? 409 : 404;
        throw error;
      }

      const movements = [];

      // 2. Check and deduct stock for each product
      for (const item of sale.items) {

        const product = await Product.findOneAndUpdate(
          {
            _id: item.product,
            isActive: true,
            quantity: { $gte: item.quantity }
          },
          {
            $inc: { quantity: -item.quantity }
          },
          {
            returnDocument: "before",
            session,
            runValidators: true
          }
        );

        // 3. Handle missing product or insufficient stock
        if (!product) {
          const currentProduct = await Product.findById(
            item.product
          ).session(session);

          const error = new Error(
            !currentProduct || !currentProduct.isActive
              ? `Product not found or inactive: ${item.name}`
              : `Insufficient stock for ${item.name}. Available: ${currentProduct.quantity}, Required: ${item.quantity}`
          );

          error.statusCode = 409;
          throw error;
        }

        const previousQuantity = product.quantity;
        const newQuantity = previousQuantity - item.quantity;

        // 4. Prepare stock movement history
        movements.push({
          product: product._id,
          type: "sale",
          referenceModel: "Sale",
          referenceId: sale._id,
          quantity: item.quantity,
          previousQuantity,
          newQuantity,
          note: `Stock deducted for sales invoice ${sale.invoiceNumber}`,
          createdBy: req.user._id
        });
      }

      // 5. Save stock movements
      await StockMovement.insertMany(movements, { session });

      // 6. Update sale status
      const updatedSale = await Sale.findOneAndUpdate(
        {
          _id: id,
          status: "draft"
        },
        {
          $set: {
            status: "completed",
            completedBy: req.user._id,
            completedAt: new Date()
          }
        },
        {
          returnDocument: "after",
          runValidators: true,
          session
        }
      );

      if (!updatedSale) {
        const error = new Error(
          "Sale status changed. Please refresh and try again."
        );
        error.statusCode = 409;
        throw error;
      }
    });

    // 7. Return completed sale
    const result = await Sale.findById(id)
      .populate("customer", "name phone email")
      .populate("items.product", "name sku quantity")
      .populate("createdBy", "name email")
      .populate("completedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Sale completed and stock deducted successfully",
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


// GET ALL SALES WITH PAGINATION AND FILTERS
const getSales = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const { status, paymentStatus, paymentMethod } = req.query;

    const filter = {};

    if (status) {
      const allowedStatuses = ["draft", "completed", "cancelled"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sale status"
        });
      }

      filter.status = status;
    }

    if (paymentStatus) {
      const allowedPaymentStatuses = ["unpaid", "paid", "partial"];

      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status"
        });
      }

      filter.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      const allowedMethods = ["cash", "card", "bank_transfer", "other"];

      if (!allowedMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method"
        });
      }

      filter.paymentMethod = paymentMethod;
    }

    const skip = (page - 1) * limit;

    const [sales, totalSales] = await Promise.all([
      Sale.find(filter)
        .populate("customer", "name phone email")
        .populate("items.product", "name sku")
        .populate("createdBy", "name email")
        .populate("completedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Sale.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: sales,
      pagination: {
        totalSales,
        currentPage: page,
        totalPages: Math.ceil(totalSales / limit),
        limit,
        hasNextPage: page * limit < totalSales,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};


 // SEARCH SALES BY INVOICE NUMBER
const searchSalesByInvoice = async (req, res, next) => {
  try {
    const invoiceNumber = req.query.invoiceNumber?.trim();

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: "Invoice number is required"
      });
    }

    if (invoiceNumber.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Invoice number is too long"
      });
    }

    const sales = await Sale.find({
      invoiceNumber: {
        $regex: invoiceNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i"
      }
    })
      .populate("customer", "name phone email")
      .populate("items.product", "name sku")
      .populate("createdBy", "name email")
      .populate("completedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    next(error);
  }
};


// GET SINGLE SALE DETAILS
const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID"
      });
    }

    // Find sale and populate related information
    const sale = await Sale.findById(id)
      .populate("customer", "name phone email company address city")
      .populate("items.product", "name sku sellingPrice quantity unit")
      .populate("createdBy", "name email role")
      .populate("completedBy", "name email role")
      .lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Sale details retrieved successfully",
      data: sale
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  createSale,
  completeSale,
  getSales,
  searchSalesByInvoice,
  getSaleById
};
