// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// Register new user
router.post('/register', async (req, res) => {
  const { username, password, height_cm, weight_kg, age, gender, sport, fitness_level } = req.body;

  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ msg: 'Username already taken' });

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    username,
    passwordHash,
    devices: [],
    height_cm,
    weight_kg,
    age,
    gender,
    sport,
    fitness_level,
    previous_injuries: []
  });

  res.status(201).json({ msg: 'User registered' });
});

// Login existing user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1d' });

  res.json({
    token,
    username: user.username,
    isAdmin: user.isAdmin  // ✅ send this to frontend
  });
});

module.exports = router;
