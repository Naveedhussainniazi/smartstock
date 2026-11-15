
const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    type: {
      type: String,
      enum: ["purchase", "sale", "adjustment", "return"],
      required: true
    },

    referenceModel: {
      type: String,
      enum: ["Purchase", "Sale", "StockAdjustment"],
      required: true
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "referenceModel"
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

    note: {
      type: String,
      trim: true,
      default: ""
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

stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ referenceId: 1 });

module.exports = mongoose.model(
  "StockMovement",
  stockMovementSchema
);
