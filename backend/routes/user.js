const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth'); // Make sure this exists

// GET user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("❌ GET /profile error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    console.log("🛠 PUT /profile called");
    console.log("Updates:", req.body);
    console.log("User ID:", req.user.id);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    console.error("❌ PUT /profile error:", err.message);
    res.status(500).json({ error: "Update failed" });
  }
});

module.exports = router;
