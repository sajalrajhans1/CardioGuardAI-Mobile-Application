const mongoose = require("mongoose");
const crypto = require("crypto");

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    patientCode: {
      type: String,
      unique: true,
      index: true,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    personalInfo: {
      fullName: { type: String, required: true },
      dob: { type: Date },
      gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
      },
    },

    physicalMetrics: {
      height: { type: Number }, // cm
      weight: { type: Number }, // kg
    },

    medicalBackground: {
      panicHistory: { type: Boolean, default: false },
      medications: [{ type: String }],
      onMedication: { type: Boolean, default: false },
    },

    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },

    deviceInfo: {
      strapStatus: {
        type: String,
        enum: ["Connected", "Not Connected"],
        default: "Not Connected",
      },
      lastSync: { type: Date },
      firmwareVersion: { type: String },
    },

    preferences: {
      shareWithCaretaker: { type: Boolean, default: true },
      notificationsEnabled: { type: Boolean, default: true },
    },

    caretakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

patientProfileSchema.pre("save", function (next) {
  if (!this.patientCode) {
    this.patientCode =
      "CG-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  }
  next();
});

module.exports = mongoose.model("PatientProfile", patientProfileSchema);