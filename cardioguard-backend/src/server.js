const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth.routes");

app.use("/api/auth", authRoutes);

const patientRoutes = require("./routes/patient.routes");
app.use("/api/patient", patientRoutes);


const { protect } = require("./middleware/auth.middleware");

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You are authorized",
    user: req.user,
  });
});



app.get("/", (req, res) => {
  res.send("CardioGuardAI Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
