const { fetchNearbyHospitals } = require('../services/hospitalService');
const User = require('../models/User');

/**
 * GET /api/hospitals/nearby
 * Query params: radius (in km, default 15)
 */
const getNearbyHospitals = async (req, res) => {
  try {
    const radius = parseFloat(req.query.radius) || 15;
    
    // Check user's saved location coordinates
    let lat = req.user.location?.latitude;
    let lon = req.user.location?.longitude;

    // Fallback: Check query parameters (in case client overrides or manually inputs location)
    if (req.query.latitude && req.query.longitude) {
      lat = parseFloat(req.query.latitude);
      lon = parseFloat(req.query.longitude);
    }

    if (lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: 'Location not configured. Please capture/provide coordinates.',
        code: 'LOCATION_REQUIRED',
      });
    }

    const hospitals = await fetchNearbyHospitals(lat, lon, radius);

    res.json({
      latitude: lat,
      longitude: lon,
      radiusKm: radius,
      hospitals,
    });
  } catch (err) {
    console.error('getNearbyHospitals error:', err);
    res.status(500).json({ error: 'Failed to fetch nearby hospitals.' });
  }
};

module.exports = {
  getNearbyHospitals,
};
