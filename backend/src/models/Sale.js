
const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null
    },
    customerName: {
      type: String,
      trim: true,
      default: "Walk-in Customer"
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: items => items.length > 0,
        message: "Sale must contain at least one product"
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "other"],
      default: "cash"
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "partial"],
      default: "paid"
    },
    status: {
      type: String,
      enum: ["draft", "completed", "cancelled"],
      default: "draft"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

saleSchema.index({ createdAt: -1 });
saleSchema.index({ status: 1 });
saleSchema.index({ customer: 1 });

module.exports = mongoose.model("Sale", saleSchema);
