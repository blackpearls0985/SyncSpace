const express = require('express');
const { handleStripeWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Stripe webhooks MUST parse raw body as Buffer for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
