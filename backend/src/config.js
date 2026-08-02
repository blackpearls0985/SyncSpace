// Central configuration module exporting environment variables.
require('dotenv').config();

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-not-for-production',
  PORT: parseInt(process.env.PORT, 10) || 3001,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Stripe Configuration (Test Mode)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_mock_secret_key',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_webhook_secret',
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || 'price_mock_pro_monthly',
};
