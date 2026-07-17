const User = require('../models/User');
const { reverseGeocode } = require('../services/hospitalService');

/**
 * PUT /api/users/location
 * Body: { latitude, longitude }
 */
const updateUserLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude and longitude are required.' });
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({ error: 'latitude and longitude must be valid numbers.' });
    }

    // Call OSM Nominatim reverse geocode
    let geoDetails = { city: '', district: '', state: '', country: '', postalCode: '' };
    try {
      geoDetails = await reverseGeocode(latNum, lonNum);
    } catch (geoErr) {
      console.warn('Geocoding failed, continuing with empty address details:', geoErr.message);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Save location details
    user.location = {
      latitude: latNum,
      longitude: lonNum,
      city: geoDetails.city,
      district: geoDetails.district,
      state: geoDetails.state,
      country: geoDetails.country,
      postalCode: geoDetails.postalCode,
      updatedAt: new Date(),
    };

    // Synchronize root city/state fields to ensure donor search query works
    if (geoDetails.city) user.city = geoDetails.city;
    if (geoDetails.state) user.state = geoDetails.state;

    await user.save();

    res.json({
      message: 'Location updated successfully.',
      user,
    });
  } catch (err) {
    console.error('updateUserLocation error:', err);
    res.status(500).json({ error: 'Failed to update user location.' });
  }
};

module.exports = {
  updateUserLocation,
};
