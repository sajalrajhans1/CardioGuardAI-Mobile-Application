const express = require("express");
const router = express.Router();

const { protect, requireRole } = require("../middleware/auth.middleware");
const patientController = require("../controllers/patient.controller");

const upload = require("../middleware/upload.middleware");
const cloudinary = require("../config/cloudinary");

/**
 * =========================
 * PATIENT PROFILE ROUTES
 * =========================
 */

router.post(
  "/profile",
  protect,
  requireRole("patient"),
  patientController.createProfile
);

router.get(
  "/me",
  protect,
  requireRole("patient"),
  patientController.getMyProfile
);

router.put(
  "/me",
  protect,
  requireRole("patient"),
  patientController.updateMyProfile
);

/**
 * =========================
 * NEARBY HOSPITALS ROUTE
 * =========================
 */

router.get(
  "/nearby-hospitals",
  patientController.getNearbyHospitals
);

/**
 * =========================
 * PROFILE PHOTO UPLOAD
 * =========================
 */

router.post(
  "/upload-photo",
  protect,
  requireRole("patient"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No image uploaded",
        });
      }

      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
        "base64"
      )}`;

      const result = await cloudinary.uploader.upload(base64, {
        folder: "cardioguard/profile",
      });

      return res.status(200).json({
        imageUrl: result.secure_url,
      });
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      return res.status(500).json({
        message: "Image upload failed",
      });
    }
  }
);

/**
 * =========================
 * CARETAKER ROUTES
 * =========================
 */

router.post(
  "/link",
  protect,
  requireRole("caretaker"),
  patientController.linkCaretaker
);

router.get(
  "/:id",
  protect,
  requireRole("caretaker"),
  patientController.getPatientById
);

module.exports = router;