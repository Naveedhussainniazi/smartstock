const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");

// Register models used by StockMovement.refPath
require("../models/Purchase");
require("../models/Sale");
require("../models/StockAdjustment");

// SYNC STOCK ALERTS
const syncStockAlerts = async (userId) => {
  const [outOfStockProducts, lowStockProducts] = await Promise.all([
    Product.find({
      isActive: true,
      quantity: 0,
    }).select("_id name sku quantity"),

    Product.find({
      isActive: true,
      quantity: { $gt: 0 },
      $expr: { $lte: ["$quantity", "$minStockLevel"] },
    }).select("_id name sku quantity minStockLevel"),
  ]);

  const outOfStockIds = outOfStockProducts.map((p) => p._id);
  const lowStockIds = lowStockProducts.map((p) => p._id);

  // Remove alerts for products that no longer match the conditions
  await Promise.all([
    Notification.deleteMany({
      user: userId,
      type: "out_of_stock",
      referenceId: { $nin: outOfStockIds },
    }),

    Notification.deleteMany({
      user: userId,
      type: "low_stock",
      referenceId: { $nin: lowStockIds },
    }),
  ]);

  const operations = [];

  outOfStockProducts.forEach((product) => {
    operations.push({
      updateOne: {
        filter: {
          user: userId,
          type: "out_of_stock",
          referenceId: product._id,
        },
        update: {
          $setOnInsert: {
            user: userId,
            type: "out_of_stock",
            title: "Product Out of Stock",
            message: `${product.name} (${product.sku}) is out of stock.`,
            referenceModel: "Product",
            referenceId: product._id,
            isRead: false,
          },
        },
        upsert: true,
      },
    });
  });

  lowStockProducts.forEach((product) => {
    operations.push({
      updateOne: {
        filter: {
          user: userId,
          type: "low_stock",
          referenceId: product._id,
        },
        update: {
          $setOnInsert: {
            user: userId,
            type: "low_stock",
            title: "Low Stock Alert",
            message: `${product.name} (${product.sku}) has only ${product.quantity} units remaining. Minimum stock level is ${product.minStockLevel}.`,
            referenceModel: "Product",
            referenceId: product._id,
            isRead: false,
          },
        },
        upsert: true,
      },
    });
  });

  if (operations.length > 0) {
    await Notification.bulkWrite(operations);
  }
};

// SYNC RECENT STOCK ACTIVITIES
const syncRecentActivities = async (userId) => {
  const movements = await StockMovement.find()
    .populate("product", "name sku")
    .populate("referenceId")
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const activityMap = new Map();

  movements.forEach((movement) => {
    let notificationType;
    let title;
    let message;
    let referenceModel = movement.referenceModel;
    let reference = movement.referenceId;

    if (!reference || !reference._id) return;

    if (referenceModel === "Sale") {
      notificationType = "sale";
      title = "New Sale Completed";
      message = `Sale ${reference.invoiceNumber || ""} has been completed.`;
    } else if (referenceModel === "Purchase") {
      notificationType = "purchase";
      title = "Purchase Received";
      message = `Purchase ${reference.invoiceNumber || ""} has been received.`;
    } else if (referenceModel === "StockAdjustment") {
      notificationType = "adjustment";
      title = "Stock Adjusted";
      message = `Stock adjustment ${reference.adjustmentNumber || ""} was recorded for ${movement.product?.name || "a product"}.`;
    } else {
      return;
    }

    const key = `${notificationType}-${reference._id}`;

    if (!activityMap.has(key)) {
      activityMap.set(key, {
        user: userId,
        type: notificationType,
        title,
        message,
        referenceModel,
        referenceId: reference._id,
        isRead: false,
      });
    }
  });

  const operations = Array.from(activityMap.values()).map((item) => ({
    updateOne: {
      filter: {
        user: userId,
        type: item.type,
        referenceId: item.referenceId,
      },
      update: {
        $setOnInsert: item,
      },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await Notification.bulkWrite(operations);
  }
};

// GET NOTIFICATIONS
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await syncStockAlerts(userId);
    await syncRecentActivities(userId);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),

      Notification.countDocuments({
        user: userId,
        isRead: false,
      }),
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// MARK ONE NOTIFICATION AS READ
const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        user: req.user._id,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// MARK ALL NOTIFICATIONS AS READ
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        user: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
