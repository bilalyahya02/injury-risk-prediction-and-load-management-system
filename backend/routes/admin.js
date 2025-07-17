// routes/admin.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config');

// Auth middleware
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Missing token' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) return res.status(403).json({ msg: 'Admin only' });
    req.adminUser = user;
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// GET /api/admin/users → list all users + assigned devices
router.get('/users', auth, async (req, res) => {
  const users = await User.find({}, 'username devices');
  res.json(users);
});

// GET /api/admin/devices → return all known device IDs (from users)
router.get('/devices', auth, async (req, res) => {
  const users = await User.find({});
  const allDevices = users.flatMap(u => u.devices);
  const uniqueDevices = [...new Set(allDevices)];
  res.json(uniqueDevices);
});

// POST /api/admin/assign → assign a device to a user
router.post('/assign', auth, async (req, res) => {
  const { username, device_id } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ msg: 'User not found' });

  const index = user.devices.indexOf(device_id);
  if (index !== -1) {
    // ❌ Already assigned → unassign
    user.devices.splice(index, 1);
    await user.save();
    return res.json({ msg: `Device ${device_id} unassigned from ${username}` });
  }

  // ➕ Assign new
  user.devices.push(device_id);
  await user.save();
  res.json({ msg: `Device ${device_id} assigned to ${username}` });
});



module.exports = router;
