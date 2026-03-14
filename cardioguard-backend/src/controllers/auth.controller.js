const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const CaretakerProfile = require("../models/CaretakerProfile");

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      fullName,
      dob,
      gender,
      emergencyContact,
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
    });

    // If patient, create PatientProfile
    if (role === "patient") {
      const patientId = "PAT" + Date.now();

      await PatientProfile.create({
        userId: user._id,
        fullName,
        dob,
        gender,
        emergencyContact,
        patientId,
      });
    }

    // If caretaker, create CaretakerProfile
    if (role === "caretaker") {
      await CaretakerProfile.create({
        userId: user._id,
        fullName,
      });
    }

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user),
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user),
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
