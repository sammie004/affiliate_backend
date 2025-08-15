const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/controller');
router.post('/Signup', signup);
router.post('/Login', login);

module.exports = router;