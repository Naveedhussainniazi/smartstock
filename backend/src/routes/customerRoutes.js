
const express = require("express");
const router = express.Router();

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} = require("../controllers/customerController");

const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const {
  customerSchema,
  updateCustomerSchema
} = require("../validators/customerValidator");

router.use(protect);

// Admin and staff can read
router.get("/", getCustomers);
router.get("/:id", getCustomerById);

// Only admin can write
router.post(
  "/",
  authorize("admin"),
  validate(customerSchema),
  createCustomer
);

router.put(
  "/:id",
  authorize("admin"),
  validate(updateCustomerSchema),
  updateCustomer
);

router.delete(
  "/:id",
  authorize("admin"),
  deleteCustomer
);

module.exports = router;
