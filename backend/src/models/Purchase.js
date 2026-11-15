
const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema(
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

    unitCost: {
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

const purchaseSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true
    },

    items: {
      type: [purchaseItemSchema],
      required: true,
      validate: {
        validator: items => items.length > 0,
        message: "Purchase must contain at least one product"
      }
    },

    subtotal: {
      type: Number,
      required: true,
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

    status: {
      type: String,
      enum: ["draft", "received", "cancelled"],
      default: "draft"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    receivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

purchaseSchema.index({ createdAt: -1 });
purchaseSchema.index({ status: 1 });

module.exports = mongoose.model("Purchase", purchaseSchema);
