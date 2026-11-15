const Supplier = require("../models/Supplier");
const Product = require("../models/Product");

// CREATE SUPPLIER
const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL SUPPLIERS
const getSuppliers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const search = req.query.search || "";

    const filter = {
      isActive: true
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const totalSuppliers = await Supplier.countDocuments(filter);

    const suppliers = await Supplier.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        totalSuppliers,
        currentPage: page,
        totalPages: Math.ceil(totalSuppliers / limit),
        limit
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE SUPPLIER
const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }

    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE SUPPLIER
const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { $set: req.body },
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// DELETE SUPPLIER (SOFT DELETE)
const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }

    const hasPurchases = await require("../models/Purchase").exists({
      supplier: supplier._id,
      status: { $in: ["draft", "received"] }
    });

    if (hasPurchases) {
      return res.status(400).json({
        success: false,
        message: "Supplier cannot be deleted because purchases are linked to it"
      });
    }

    supplier.isActive = false;
    await supplier.save();

    res.status(200).json({
      success: true,
      message: "Supplier deactivated successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
};