const User = require('../models/User');

/**
 * GET /api/donors
 * List available donors (for patient searching)
 * Query params: bloodGroup, city, page, limit
 */
const listDonors = async (req, res) => {
  try {
    const { bloodGroup, city, page = 1, limit = 20 } = req.query;
    const filter = { role: 'donor', availability: true };
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter.city = { $regex: city, $options: 'i' };

    const donors = await User.find(filter)
      .select('name bloodGroup age gender city state availability lastDonationDate profilePhoto mobile')
      .sort({ lastDonationDate: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    res.json({ donors });
  } catch (err) {
    console.error('listDonors error:', err);
    res.status(500).json({ error: 'Could not fetch donors.' });
  }
};

/**
 * GET /api/donors/:id
 * Full donor profile
 */
const getDonor = async (req, res) => {
  try {
    const donor = await User.findById(req.params.id)
      .select('name bloodGroup age gender city state availability lastDonationDate profilePhoto mobile role');

    if (!donor || donor.role !== 'donor') {
      return res.status(404).json({ error: 'Donor not found.' });
    }

    res.json({ donor });
  } catch (err) {
    console.error('getDonor error:', err);
    res.status(500).json({ error: 'Could not fetch donor profile.' });
  }
};

module.exports = { listDonors, getDonor };
