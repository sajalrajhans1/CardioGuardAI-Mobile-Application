const express    = require("express");
const dotenv     = require("dotenv");
const cors       = require("cors");
const connectDB  = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ── Auth ──────────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// ── Patients ─────────────────────────────────────────────────────────────────
// FIXED: was "/api/patient" (singular) — frontend calls "/api/patients" (plural)
const patientRoutes = require("./routes/patient.routes");
app.use("/api/patients", patientRoutes);

// ── Protected test route ──────────────────────────────────────────────────────
const { protect } = require("./middleware/auth.middleware");
app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "You are authorized", user: req.user });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("CardioGuardAI Backend Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});