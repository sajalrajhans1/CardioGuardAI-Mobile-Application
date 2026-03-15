const mongoose = require("mongoose");
const crypto   = require("crypto");

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true,
      index:    true,
    },

    // Human-readable ID — format: PAT<timestamp>
    // Matches existing DB documents: { patientId: "PAT1771504055659" }
    patientId: {
      type:   String,
      unique: true,
      sparse: true,
      index:  true,
    },

    // Legacy random code — format: CG-XXXXXXXX
    patientCode: {
      type:   String,
      unique: true,
      sparse: true,
      index:  true,
    },

    // Top-level fullName — matches existing DB documents where fullName was
    // stored at root level (e.g. { fullName: "sajal" }).
    fullName: {
      type:    String,
      default: "",
    },

    profilePhoto: {
      type:    String,
      default: "",
    },

    // Nested block used by newer registration flows
    personalInfo: {
      fullName: { type: String },
      dob:      { type: Date },
      gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
      },
    },

    physicalMetrics: {
      height: { type: Number },
      weight: { type: Number },
    },

    medicalBackground: {
      panicHistory:  { type: Boolean, default: false },
      medications:   [{ type: String }],
      onMedication:  { type: Boolean, default: false },
    },

    emergencyContact: {
      name:     { type: String },
      phone:    { type: String },
      relation: { type: String },
    },

    deviceInfo: {
      strapStatus: {
        type:    String,
        enum:    ["Connected", "Not Connected"],
        default: "Not Connected",
      },
      lastSync:        { type: Date },
      firmwareVersion: { type: String },
    },

    preferences: {
      shareWithCaretaker:    { type: Boolean, default: true },
      notificationsEnabled:  { type: Boolean, default: true },
    },

    caretakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  "User",
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate IDs before save.
// Uses async pre-save (Mongoose 6+) — no next() needed, avoids
// "next is not a function" when middleware is async.
patientProfileSchema.pre("save", async function () {
  if (!this.patientId) {
    this.patientId = "PAT" + Date.now();
  }
  if (!this.patientCode) {
    this.patientCode = "CG-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  }
});

module.exports = mongoose.model("PatientProfile", patientProfileSchema);