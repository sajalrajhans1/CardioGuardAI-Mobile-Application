const mongoose = require("mongoose");

const caretakerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    patients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientProfile",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("CaretakerProfile", caretakerProfileSchema);
