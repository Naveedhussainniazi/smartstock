
const express = require("express");
const rateLimit = require("express-rate-limit");


const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
} = require("../controllers/authController");

const validate = require("../middleware/validate");

const {
  registerSchema,
  loginSchema,
} = require("../validators/authValidator");

const { protect } = require("../middleware/authMiddleware");

// Limit repeated login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

// Registration
router.post(
  "/register",
  validate(registerSchema),
  registerUser
);

// Login
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  loginUser
);

// Logged-in user
router.get("/profile", protect, getProfile);

// Logout
router.post("/logout", protect, logoutUser);

module.exports = router;
