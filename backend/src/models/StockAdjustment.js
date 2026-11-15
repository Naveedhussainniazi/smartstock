
const mongoose = require("mongoose");

const stockAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    type: {
      type: String,
      enum: ["increase", "decrease"],
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    previousQuantity: {
      type: Number,
      required: true,
      min: 0
    },

    newQuantity: {
      type: Number,
      required: true,
      min: 0
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

stockAdjustmentSchema.index({ createdAt: -1 });
stockAdjustmentSchema.index({ product: 1, createdAt: -1 });
stockAdjustmentSchema.index({ type: 1 });

module.exports = mongoose.model(
  "StockAdjustment",
  stockAdjustmentSchema
);
