const express = require('express');
const { signup, login, logout, me } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;
