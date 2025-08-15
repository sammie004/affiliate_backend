const express = require('express');
const router = express.Router()

const {signup, login, admin } = require('../controllers/controller');

router.post('/Signup', signup);
router.post('/Login', login);
router.get('/admin/getUsers',admin)
// router.get('/referral/:code', handleReferralClick);

module.exports = router;