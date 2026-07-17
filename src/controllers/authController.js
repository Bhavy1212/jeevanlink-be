const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

/**
 * POST /api/auth/register
 * Body: { mobile, role, name?, age?, gender?, bloodGroup?, city?, state? }
 * For the prototype the "password" is the mobile number itself.
 */
const register = async (req, res) => {
  try {
    const { mobile, role, name, age, gender, bloodGroup, city, state } = req.body;

    if (!mobile || !role) {
      return res.status(400).json({ error: 'mobile and role are required.' });
    }
    if (!['donor', 'patient'].includes(role)) {
      return res.status(400).json({ error: 'role must be donor or patient.' });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      // Return token for existing user (idempotent for prototype)
      return res.json({ token: generateToken(existing._id), user: existing });
    }

    const passwordHash = await bcrypt.hash(mobile, 10); // prototype: mobile = password
    const user = await User.create({
      mobile, role, name, age, gender, bloodGroup,
      city, state, passwordHash,
    });

    res.status(201).json({ token: generateToken(user._id), user });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

/**
 * POST /api/auth/login
 * Body: { mobile, otp }  (otp = 123456 for prototype)
 */
const login = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile) return res.status(400).json({ error: 'mobile is required.' });

    // Prototype: any user who enters 123456 is authenticated
    if (otp !== '123456') {
      return res.status(401).json({ error: 'Invalid OTP.' });
    }

    let user = await User.findOne({ mobile });
    if (!user) {
      // Auto-create on first login (prototype behaviour)
      user = await User.create({ mobile, role: 'patient', passwordHash: '' });
    }

    res.json({ token: generateToken(user._id), user });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

/**
 * GET /api/auth/me  (protected)
 */
const me = async (req, res) => {
  res.json({ user: req.user });
};

/**
 * PATCH /api/auth/me  (protected)
 * Update current user's profile
 */
const updateMe = async (req, res) => {
  try {
    const allowed = ['name', 'age', 'gender', 'bloodGroup', 'city', 'state',
                     'area', 'availability', 'lastDonationDate', 'profilePhoto'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Could not update profile.' });
  }
};

module.exports = { register, login, me, updateMe };
