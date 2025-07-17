// routes/devices.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// ✅ Auth middleware
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Missing token' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// 📦 GET /api/devices → list devices assigned to user
router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ msg: 'User not found' });

  res.json({ devices: user.devices });
});

module.exports = router;
