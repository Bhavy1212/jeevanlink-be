const express = require('express');
const { updateUserLocation } = require('../controllers/userLocationController');
const { getNearbyHospitals } = require('../controllers/hospitalController');
const auth = require('../middleware/auth');

const router = express.Router();

// JWT Protected Location & Hospital endpoints
router.put('/location', auth, updateUserLocation);
router.get('/nearby', auth, getNearbyHospitals);

module.exports = router;
