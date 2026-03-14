const PatientProfile = require("../models/PatientProfile");
const User = require("../models/User");
const axios = require("axios");

/**
 * Create profile
 */
exports.createProfile = async (req, res) => {
  try {
    const existing = await PatientProfile.findOne({
      userId: req.user._id,
    });

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
 * Get own profile (patient)
 */
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({
      userId: req.user._id,
    }).populate("caretakers", "email role");

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update own profile
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
 * Caretaker links to patient using patientCode
 */
exports.linkCaretaker = async (req, res) => {
  try {
    const { patientCode } = req.body;

    const profile = await PatientProfile.findOne({ patientCode });

    if (!profile) {
      return res.status(404).json({ message: "Invalid patient code" });
    }

    if (!profile.preferences.shareWithCaretaker) {
      return res
        .status(403)
        .json({ message: "Patient has disabled sharing" });
    }

    if (!profile.caretakers.includes(req.user._id)) {
      profile.caretakers.push(req.user._id);
      await profile.save();
    }

    res.json({ message: "Caretaker linked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Caretaker views linked patient profile
 */
exports.getPatientById = async (req, res) => {
  try {
    const profile = await PatientProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const isLinked = profile.caretakers.includes(req.user._id);

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
 * =========================
 */

exports.getNearbyHospitals = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude and longitude required",
      });
    }

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${lat},${lng}`,
          radius: 5000,
          type: "hospital",
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const data = response.data;

    if (data.status !== "OK") {
      return res.status(400).json({
        message: "Unable to fetch hospitals",
        googleStatus: data.status,
      });
    }

    const hospitals = data.results.map((h) => ({
      id: h.place_id,
      name: h.name,
      address: h.vicinity,
      lat: h.geometry.location.lat,
      lng: h.geometry.location.lng,
    }));

    res.json(hospitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error fetching hospitals",
    });
  }
};