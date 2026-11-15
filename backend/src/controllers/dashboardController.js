
const Product = require("../models/Product");
const Category = require("../models/Category");
const Supplier = require("../models/Supplier");
const Customer = require("../models/Customer");
const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const StockMovement = require("../models/StockMovement");

// DASHBOARD OVERVIEW
const getDashboardOverview = async (req, res, next) => {
  try {
    // Date ranges based on server's local timezone
    const now = new Date();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const [
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalCustomers,
      lowStockProducts,
      outOfStockProducts,
      salesSummary,
      draftSales,
      purchaseSummary,
      recentSales,
      recentMovements
    ] = await Promise.all([

      Product.countDocuments({ isActive: true }),

      Category.countDocuments({ isActive: true }),

      Supplier.countDocuments({ isActive: true }),

      Customer.countDocuments({ isActive: true }),

      Product.countDocuments({
        isActive: true,
        $expr: {
          $lte: ["$quantity", "$minStockLevel"]
        }
      }),

      Product.countDocuments({
        isActive: true,
        quantity: 0
      }),

      // Sales summary
      Sale.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: "$grandTotal" },

            todaySales: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", today] },
                  1,
                  0
                ]
              }
            },

            todayRevenue: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", today] },
                  "$grandTotal",
                  0
                ]
              }
            },

            monthlyRevenue: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", monthStart] },
                  "$grandTotal",
                  0
                ]
              }
            }
          }
        }
      ]),

      Sale.countDocuments({ status: "draft" }),

      // Received purchase summary
      Purchase.aggregate([
        { $match: { status: "received" } },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: 1 },
            totalPurchaseAmount: { $sum: "$grandTotal" }
          }
        }
      ]),

      // Latest completed sales
      Sale.find({ status: "completed" })
        .populate("customer", "name phone")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Latest stock movements
      StockMovement.find()
        .populate("product", "name sku")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    const sales = salesSummary[0] || {
      totalSales: 0,
      totalRevenue: 0,
      todaySales: 0,
      todayRevenue: 0,
      monthlyRevenue: 0
    };

    const purchases = purchaseSummary[0] || {
      totalPurchases: 0,
      totalPurchaseAmount: 0
    };

    res.status(200).json({
      success: true,
      message: "Dashboard overview retrieved successfully",

      data: {
        inventory: {
          totalProducts,
          totalCategories,
          lowStockProducts,
          outOfStockProducts
        },

        business: {
          totalSuppliers,
          totalCustomers
        },

        sales: {
          totalSales: sales.totalSales,
          totalRevenue: sales.totalRevenue,
          todaySales: sales.todaySales,
          todayRevenue: sales.todayRevenue,
          monthlyRevenue: sales.monthlyRevenue,
          draftSales
        },

        purchases: {
          totalPurchases: purchases.totalPurchases,
          totalPurchaseAmount: purchases.totalPurchaseAmount
        },

        recentSales,
        recentMovements
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardOverview
};
