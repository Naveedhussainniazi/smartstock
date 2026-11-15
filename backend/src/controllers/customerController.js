
  const mongoose = require("mongoose");
  const Customer = require("../models/Customer");

  // CREATE CUSTOMER
  const createCustomer = async (req, res, next) => {
    try {
      const customer = await Customer.create(req.body);

      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer
      });
    } catch (error) {
      next(error);
    }
  };

  // GET ALL CUSTOMERS
  const getCustomers = async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit, 10) || 10)
      );

      const filter = { isActive: true };

      if (req.query.search) {
        const escapedSearch = req.query.search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        filter.$or = [
          { name: { $regex: escapedSearch, $options: "i" } },
          { phone: { $regex: escapedSearch, $options: "i" } },
          { email: { $regex: escapedSearch, $options: "i" } },
          { company: { $regex: escapedSearch, $options: "i" } }
        ];
      }

      const totalCustomers = await Customer.countDocuments(filter);

      const customers = await Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.status(200).json({
        success: true,
        data: customers,
        pagination: {
          totalCustomers,
          currentPage: page,
          totalPages: Math.ceil(totalCustomers / limit),
          limit
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // GET SINGLE CUSTOMER
  const getCustomerById = async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID"
        });
      }

      const customer = await Customer.findOne({
        _id: req.params.id,
        isActive: true
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found"
        });
      }

      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  };

  // UPDATE CUSTOMER
  const updateCustomer = async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID"
        });
      }

      const customer = await Customer.findOneAndUpdate(
        {
          _id: req.params.id,
          isActive: true
        },
        {
          $set: req.body
        },
        {
          returnDocument: "after",
          runValidators: true
        }
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        data: customer
      });
    } catch (error) {
      next(error);
    }
  };

  // SOFT DELETE CUSTOMER
  const deleteCustomer = async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID"
        });
      }

      const customer = await Customer.findOneAndUpdate(
        {
          _id: req.params.id,
          isActive: true
        },
        {
          $set: { isActive: false }
        },
        {
          returnDocument: "after",
          runValidators: true
        }
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Customer deactivated successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
  };
