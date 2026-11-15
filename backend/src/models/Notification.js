
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    type: {
      type: String,
      enum: [
        "low_stock",
        "out_of_stock",
        "sale",
        "purchase",
        "adjustment"
      ],
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    referenceModel: {
      type: String,
      enum: [
        "Product",
        "Sale",
        "Purchase",
        "StockAdjustment"
      ],
      default: null
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    isRead: {
      type: Boolean,
      default: false
    },

    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index(
  { user: 1, type: 1, referenceId: 1 },
  { unique: true, partialFilterExpression: { referenceId: { $type: "objectId" } } }
);

module.exports = mongoose.model("Notification", notificationSchema);
