const express = require('express');
const { listDonors, getDonor } = require('../controllers/donorController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public: list available donors by city/blood group (no login needed to browse)
router.get('/', listDonors);
// Protected: full donor profile (requires login)
router.get('/:id', auth, getDonor);

module.exports = router;
