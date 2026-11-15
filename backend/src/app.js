
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const productRoutes = require("./routes/productRoutes");
const stockMovementRoutes = require("./routes/stockMovementRoutes");
const customerRoutes = require("./routes/customerRoutes");
const saleRoutes = require("./routes/saleRoutes");
const stockAdjustmentRoutes = require("./routes/stockAdjustmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const searchRoutes = require("./routes/searchRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SmartStock API is running",
  });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// User Management Routes
app.use("/api/users", userRoutes);

// Product Routes
app.use("/api/products", productRoutes);

// Category Routes
app.use("/api/categories", categoryRoutes);

// Supplier Routes
app.use("/api/suppliers", supplierRoutes);

// Purchase Routes
app.use("/api/purchases", purchaseRoutes);

// Customer Routes
app.use("/api/customers", customerRoutes);

// Sales Routes
app.use("/api/sales", saleRoutes);

// Stock Movement Routes
app.use("/api/stock-movements", stockMovementRoutes);

// Stock Adjustment Routes
app.use("/api/stock-adjustments", stockAdjustmentRoutes);

// Global Search Routes
app.use("/api/search", searchRoutes);

// Dashboard Routes
app.use("/api/dashboard", dashboardRoutes);

// Reports Routes
app.use("/api/reports", reportRoutes);

// Notification Routes
app.use("/api/notifications", notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Centralized Error Handler (Keep at the end)
app.use(errorMiddleware);

module.exports = app;
