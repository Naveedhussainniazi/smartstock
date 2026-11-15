
const Product = require("../models/Product");
const Category = require("../models/Category");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Sale = require("../models/Sale");
const StockAdjustment = require("../models/StockAdjustment");

// GLOBAL SEARCH
const globalSearch = async (req, res, next) => {
  try {
    const query = (req.query.query || "").trim();

    if (!query) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Enter a search keyword",
      });
    }

    if (query.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search text is too long",
      });
    }

    // Escape special regex characters
    const escapedQuery = query.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const searchRegex = new RegExp(escapedQuery, "i");

    const [
      products,
      categories,
      customers,
      suppliers,
      sales,
      adjustments,
    ] = await Promise.all([
      Product.find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { sku: searchRegex },
        ],
      })
        .select("name sku quantity sellingPrice")
        .limit(5)
        .lean(),

      Category.find({
        isActive: true,
        name: searchRegex,
      })
        .select("name")
        .limit(5)
        .lean(),

      Customer.find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      })
        .select("name email phone")
        .limit(5)
        .lean(),

      Supplier.find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { company: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      })
        .select("name company email phone")
        .limit(5)
        .lean(),

      Sale.find({
        $or: [
          { invoiceNumber: searchRegex },
          { customerName: searchRegex },
        ],
      })
        .select("invoiceNumber customerName grandTotal status createdAt")
        .limit(5)
        .lean(),

      StockAdjustment.find({
        adjustmentNumber: searchRegex,
      })
        .populate("product", "name sku")
        .select("adjustmentNumber product type quantity createdAt")
        .limit(5)
        .lean(),
    ]);

    const results = [
      ...products.map((item) => ({
        id: item._id,
        type: "product",
        title: item.name,
        subtitle: `SKU: ${item.sku}`,
        url: "/products",
      })),

      ...categories.map((item) => ({
        id: item._id,
        type: "category",
        title: item.name,
        subtitle: "Category",
        url: "/categories",
      })),

      ...customers.map((item) => ({
        id: item._id,
        type: "customer",
        title: item.name,
        subtitle: item.phone || item.email || "Customer",
        url: "/customers",
      })),

      ...suppliers.map((item) => ({
        id: item._id,
        type: "supplier",
        title: item.name,
        subtitle: item.company || item.phone || "Supplier",
        url: "/suppliers",
      })),

      ...sales.map((item) => ({
        id: item._id,
        type: "sale",
        title: item.invoiceNumber,
        subtitle: `${item.customerName} - ${item.status}`,
        url: `/sales/${item._id}`,
      })),

      ...adjustments.map((item) => ({
        id: item._id,
        type: "adjustment",
        title: item.adjustmentNumber,
        subtitle: `${item.product?.name || "Product"} - ${item.type}`,
        url: "/stock-adjustments",
      })),
    ];

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { globalSearch };
