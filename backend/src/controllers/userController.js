
const User = require("../models/User");

// GET ALL USERS
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim();
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE USER
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// CREATE USER (ADMIN)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const userRole = role || "staff";

    if (!["admin", "staff"].includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: userRole,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};


// UPDATE USER (ADMIN)
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from changing own role or status
    const isSelf = user._id.toString() === req.user._id.toString();

    if (isSelf && (role !== undefined || isActive !== undefined)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role or account status",
      });
    }

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 100 characters",
        });
      }

      user.name = name.trim();
    }

    // Validate email
    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Valid email is required",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      user.email = normalizedEmail;
    }

    // Validate role
    if (role !== undefined) {
      if (!["admin", "staff"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role",
        });
      }
    }

    // Validate account status
    if (isActive !== undefined && typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const willRemoveAdmin =
      user.role === "admin" &&
      user.isActive &&
      (role === "staff" || isActive === false);

    // Prevent removing the last active admin
    if (willRemoveAdmin) {
      const otherActiveAdmins = await User.countDocuments({
        role: "admin",
        isActive: true,
        _id: { $ne: user._id },
      });

      if (otherActiveAdmins === 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove the last active admin",
        });
      }
    }

    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};



// DELETE USER (SOFT DELETE - ADMIN)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: "User is already inactive",
      });
    }

    // Prevent deactivating the last active admin
    if (user.role === "admin") {
      const activeAdmins = await User.countDocuments({
        role: "admin",
        isActive: true,
      });

      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot deactivate the last active admin",
        });
      }
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};



module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
