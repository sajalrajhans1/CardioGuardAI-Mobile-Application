const PatientProfile = require("../models/PatientProfile");
const User           = require("../models/User");
const axios          = require("axios");

// ─── Shared helper ────────────────────────────────────────────────────────────
// Resolves a patientId string to a PatientProfile document.
// Tries every identifier the DB might hold — PAT… top-level patientId,
// legacy CG-… patientCode, or a raw Mongo _id.
async function findProfile(id) {
  if (!id) return null;

  // 1. Top-level patientId field (PAT…) — the primary case
  let profile = await PatientProfile.findOne({ patientId: id });
  if (profile) return profile;

  // 2. Legacy patientCode (CG-…)
  profile = await PatientProfile.findOne({ patientCode: id });
  if (profile) return profile;

  // 3. Raw Mongo _id (24-char hex)
  if (id.length === 24) {
    profile = await PatientProfile.findById(id).catch(() => null);
    if (profile) return profile;
  }

  return null;
}

// ─── Resolve fullName from any schema shape ───────────────────────────────────
// Existing docs store fullName at root; newer docs nest it under personalInfo.
function resolveFullName(profile) {
  return (
    profile.personalInfo?.fullName ||
    profile.fullName ||
    "Unknown"
  );
}

/**
 * =========================
 * CREATE PROFILE
 * =========================
 */
exports.createProfile = async (req, res) => {
  try {
    const existing = await PatientProfile.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const profile = await PatientProfile.create({
      userId: req.user._id,
      ...req.body,
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * GET OWN PROFILE
 * =========================
 */
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ userId: req.user._id })
      .populate("caretakers", "email role");

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * UPDATE PROFILE
 * =========================
 */
exports.updateMyProfile = async (req, res) => {
  try {
    const profile = await PatientProfile.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * VERIFY PATIENT
 * POST /api/patients/verify
 * Body: { patientId }
 * =========================
 */
exports.verifyPatient = async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    const profile = await findProfile(patientId);

    if (!profile) {
      return res.status(404).json({ message: "Invalid Patient ID" });
    }

    res.json({
      patientId:        profile.patientId || profile.patientCode || profile._id.toString(),
      fullName:         resolveFullName(profile),
      dob:              profile.personalInfo?.dob,
      gender:           profile.personalInfo?.gender,
      emergencyContact: profile.emergencyContact,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * LINK CARETAKER
 * POST /api/patients/link
 * Body: { patientId }
 * =========================
 */
exports.linkCaretaker = async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    const profile = await findProfile(patientId);

    if (!profile) {
      return res.status(404).json({ message: "Invalid Patient ID" });
    }

    // Link caretaker if not already present
    const alreadyLinked = profile.caretakers.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!alreadyLinked) {
      profile.caretakers.push(req.user._id);
      await profile.save();
    }

    res.json({
      message:   "Caretaker linked successfully",
      patientId: profile.patientId || profile.patientCode || profile._id.toString(),
      fullName:  resolveFullName(profile),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * GET PATIENT BY ID
 * GET /api/patients/:id
 * =========================
 */
exports.getPatientById = async (req, res) => {
  try {
    const profile = await PatientProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const isLinked = profile.caretakers.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!isLinked) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * NEARBY HOSPITALS
 * GET /api/patients/nearby-hospitals?lat=&lng=
 * =========================
 */
exports.getNearbyHospitals = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude required" });
    }

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${lat},${lng}`,
          radius:   5000,
          type:     "hospital",
          key:      process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const data = response.data;

    if (data.status !== "OK") {
      return res.status(400).json({
        message:      "Unable to fetch hospitals",
        googleStatus: data.status,
      });
    }

    const hospitals = data.results.map((h) => ({
      id:      h.place_id,
      name:    h.name,
      address: h.vicinity,
      lat:     h.geometry.location.lat,
      lng:     h.geometry.location.lng,
    }));

    res.json(hospitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching hospitals" });
  }
};