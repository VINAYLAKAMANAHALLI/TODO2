const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check for Hardcoded Admin Credentials
    if (email === "admin@admin.com" && password === "admin123") {
      const token = jwt.sign(
        { userId: "000000000000000000000000", role: "admin" }, // Dummy ID and Admin Role
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      return res.json({ token, role: "admin" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: "user" }, // Add 'user' role to normal tokens
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: "user" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
