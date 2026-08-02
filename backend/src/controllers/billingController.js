const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const { STRIPE_SECRET_KEY, STRIPE_PRICE_ID, CLIENT_ORIGIN } = require('../config');

const stripe = new Stripe(STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

/**
 * POST /api/orgs/:orgId/billing/checkout
 * Admin-only: Creates a Stripe Checkout Session for upgrading to Pro.
 * Dynamically supports pre-configured STRIPE_PRICE_ID or inline price creation ($19/mo).
 */
const createCheckoutSession = async (req, res) => {
  const { orgId } = req.params;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    if (org.tier === 'PRO') {
      return res.status(400).json({ error: 'Organization is already on the Pro tier.' });
    }

    // Determine line_items: use price ID if provided and valid, else use inline price_data ($19/mo)
    let line_items;
    if (STRIPE_PRICE_ID && STRIPE_PRICE_ID.startsWith('price_') && !STRIPE_PRICE_ID.includes('auto_generated') && !STRIPE_PRICE_ID.includes('mock')) {
      line_items = [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ];
    } else {
      // Dynamic $19/month recurring plan creation
      line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SyncSpace Pro Plan',
              description: 'Full activity feed history, unlimited boards, and priority features.',
            },
            unit_amount: 1900, // $19.00 USD
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items,
      client_reference_id: orgId,
      metadata: { orgId },
      customer_email: req.user.email,
      success_url: `${CLIENT_ORIGIN}/org/${orgId}/settings?upgraded=true`,
      cancel_url: `${CLIENT_ORIGIN}/org/${orgId}/settings`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('createCheckoutSession error:', err);
    
    if (err.statusCode === 401 || err.type === 'StripeAuthenticationError') {
      return res.status(400).json({
        error: 'Invalid STRIPE_SECRET_KEY in backend/.env. Please check your Stripe test secret key.',
      });
    }

    return res.status(500).json({ error: err.message || 'Failed to create checkout session.' });
  }
};

/**
 * POST /api/orgs/:orgId/billing/portal
 * Admin-only: Creates a Stripe Customer Portal Session for managing subscription.
 */
const createPortalSession = async (req, res) => {
  const { orgId } = req.params;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    if (!org.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found for this organization.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${CLIENT_ORIGIN}/org/${orgId}/settings`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('createPortalSession error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create portal session.' });
  }
};

module.exports = {
  createCheckoutSession,
  createPortalSession,
};
