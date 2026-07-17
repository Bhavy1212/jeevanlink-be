const express = require('express');
const { listDonors, getDonor } = require('../controllers/donorController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, listDonors);
router.get('/:id', auth, getDonor);

module.exports = router;
