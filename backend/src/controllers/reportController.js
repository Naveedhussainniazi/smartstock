const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");


// SALES REPORT
const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (startDate && !dateRegex.test(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate. Use YYYY-MM-DD format."
      });
    }

    if (endDate && !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDate. Use YYYY-MM-DD format."
      });
    }

    // Pakistan timezone (+05:00)
    const matchStage = { status: "completed" };

    if (startDate || endDate) {
      matchStage.completedAt = {};

      if (startDate) {
        matchStage.completedAt.$gte = new Date(
          `${startDate}T00:00:00.000+05:00`
        );
      }

      if (endDate) {
        matchStage.completedAt.$lte = new Date(
          `${endDate}T23:59:59.999+05:00`
        );
      }
    }

    if (
      startDate &&
      endDate &&
      new Date(`${startDate}T00:00:00.000+05:00`) >
        new Date(`${endDate}T23:59:59.999+05:00`)
    ) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be after endDate."
      });
    }

    const report = await Sale.aggregate([
      { $match: matchStage },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: "$grandTotal" },
                totalDiscount: { $sum: "$discount" },
                totalTax: { $sum: "$taxAmount" },
                averageSale: { $avg: "$grandTotal" }
              }
            }
          ],
          dailySales: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$completedAt",
                    timezone: "Asia/Karachi"
                  }
                },
                totalSales: { $sum: 1 },
                revenue: { $sum: "$grandTotal" }
              }
            },
            { $sort: { _id: 1 } }
          ],
          paymentMethods: [
            {
              $group: {
                _id: "$paymentMethod",
                totalSales: { $sum: 1 },
                revenue: { $sum: "$grandTotal" }
              }
            },
            { $sort: { revenue: -1 } }
          ]
        }
      }
    ]);

    const result = report[0];

    res.status(200).json({
      success: true,
      message: "Sales report retrieved successfully",
      filters: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      data: {
        summary: result.summary[0] || {
          totalSales: 0,
          totalRevenue: 0,
          totalDiscount: 0,
          totalTax: 0,
          averageSale: 0
        },
        dailySales: result.dailySales,
        paymentMethods: result.paymentMethods
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPurchaseReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (startDate && !dateRegex.test(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate. Use YYYY-MM-DD format."
      });
    }

    if (endDate && !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDate. Use YYYY-MM-DD format."
      });
    }

    const matchStage = { status: "received" };

    if (startDate || endDate) {
      matchStage.receivedAt = {};

      if (startDate) {
        matchStage.receivedAt.$gte = new Date(
          `${startDate}T00:00:00.000+05:00`
        );
      }

      if (endDate) {
        matchStage.receivedAt.$lte = new Date(
          `${endDate}T23:59:59.999+05:00`
        );
      }
    }

    if (
      startDate &&
      endDate &&
      new Date(`${startDate}T00:00:00.000+05:00`) >
        new Date(`${endDate}T23:59:59.999+05:00`)
    ) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be after endDate."
      });
    }

    const report = await Purchase.aggregate([
      { $match: matchStage },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalPurchases: { $sum: 1 },
                totalPurchaseAmount: { $sum: "$grandTotal" },
                totalTax: { $sum: "$taxAmount" },
                averagePurchase: { $avg: "$grandTotal" }
              }
            }
          ],
          dailyPurchases: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$receivedAt",
                    timezone: "Asia/Karachi"
                  }
                },
                totalPurchases: { $sum: 1 },
                amount: { $sum: "$grandTotal" }
              }
            },
            { $sort: { _id: 1 } }
          ],
          supplierWise: [
            {
              $group: {
                _id: "$supplier",
                totalPurchases: { $sum: 1 },
                amount: { $sum: "$grandTotal" }
              }
            },
            {
              $lookup: {
                from: "suppliers",
                localField: "_id",
                foreignField: "_id",
                as: "supplier"
              }
            },
            {
              $unwind: {
                path: "$supplier",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                supplierName: {
                  $ifNull: ["$supplier.name", "Unknown Supplier"]
                },
                totalPurchases: 1,
                amount: 1
              }
            },
            { $sort: { amount: -1 } }
          ]
        }
      }
    ]);

    const result = report[0];

    res.status(200).json({
      success: true,
      message: "Purchase report retrieved successfully",
      filters: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      data: {
        summary: result.summary[0] || {
          totalPurchases: 0,
          totalPurchaseAmount: 0,
          totalTax: 0,
          averagePurchase: 0
        },
        dailyPurchases: result.dailyPurchases,
        supplierWise: result.supplierWise
      }
    });
  } catch (error) {
    next(error);
  }
};

// Inventory Summary Report
const getInventoryReport = async (req, res, next) => {
  try {
    const report = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStockQuantity: { $sum: "$quantity" },
          totalPurchaseValue: {
            $sum: {
              $multiply: ["$quantity", "$purchasePrice"]
            }
          },
          totalSellingValue: {
            $sum: {
              $multiply: ["$quantity", "$sellingPrice"]
            }
          },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $lte: ["$quantity", "$minStockLevel"] },
                1,
                0
              ]
            }
          },
          outOfStockProducts: {
            $sum: {
              $cond: [{ $eq: ["$quantity", 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Inventory report retrieved successfully",
      data: report[0] || {
        totalProducts: 0,
        totalStockQuantity: 0,
        totalPurchaseValue: 0,
        totalSellingValue: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// LOW STOCK REPORT
const getLowStockReport = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: {
        $lte: ["$quantity", "$minStockLevel"]
      }
    })
      .populate("category", "name")
      .sort({ quantity: 1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Low stock report retrieved successfully",
      data: {
        totalLowStockProducts: products.length,
        products
      }
    });
  } catch (error) {
    next(error);
  }
};


// TOP SELLING PRODUCTS REPORT
const getTopSellingProducts = async (req, res, next) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    const report = await Sale.aggregate([
      {
        $match: {
          status: "completed"
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.name" },
          sku: { $first: "$items.sku" },
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.lineTotal" },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $sort: {
          totalQuantitySold: -1,
          totalRevenue: -1
        }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: 1,
          sku: 1,
          totalQuantitySold: 1,
          totalRevenue: 1,
          totalOrders: 1,
          currentStock: {
            $ifNull: ["$product.quantity", 0]
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Top selling products retrieved successfully",
      data: {
        totalProducts: report.length,
        products: report
      }
    });
  } catch (error) {
    next(error);
  }
};


// CATEGORY SALES REPORT
const getCategorySalesReport = async (req, res, next) => {
  try {
    const report = await Sale.aggregate([
      {
        $match: {
          status: "completed"
        }
      },
      {
        $unwind: "$items"
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $group: {
          _id: "$product.category",
          totalProducts: { $addToSet: "$items.product" },
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.lineTotal" },
          totalOrders: { $addToSet: "$_id" }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: {
            $ifNull: ["$category.name", "Uncategorized"]
          },
          totalProducts: { $size: "$totalProducts" },
          totalQuantitySold: 1,
          totalRevenue: 1,
          totalOrders: { $size: "$totalOrders" }
        }
      },
      {
        $sort: {
          totalRevenue: -1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Category sales report retrieved successfully",
      data: {
        totalCategories: report.length,
        categories: report
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getLowStockReport,
  getTopSellingProducts,
  getCategorySalesReport
};