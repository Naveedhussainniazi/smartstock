
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");


const seedAdmin = async () => {
  try {
    await connectDB();

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Please configure ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("Admin password must be at least 12 characters");
    }

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("An admin account already exists.");
      return;
    }

    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin"
    });

    console.log("Admin created successfully!");
    console.log("Admin email:", admin.email);

  } catch (error) {
    console.error("Admin seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();
