const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = require('../config');

const stripe = new Stripe(STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

/**
 * POST /api/webhooks/stripe
 * Stripe Webhook Handler — Sole source of truth for subscription status.
 * Signature is verified against STRIPE_WEBHOOK_SECRET.
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature using the raw request body
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`⚡ Received Stripe Webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orgId = session.client_reference_id || session.metadata?.orgId;

        if (orgId) {
          await prisma.organization.update({
            where: { id: orgId },
            data: {
              tier: 'PRO',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              subscriptionStatus: 'active',
            },
          });
          console.log(`✅ Organization ${orgId} upgraded to PRO tier.`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const org = await prisma.organization.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: sub.id },
              { stripeCustomerId: sub.customer },
            ],
          },
        });

        if (org) {
          const isPro = sub.status === 'active';
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: sub.status,
              tier: isPro ? 'PRO' : 'FREE',
            },
          });
          console.log(`🔄 Organization ${org.id} subscription status updated to ${sub.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const org = await prisma.organization.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: sub.id },
              { stripeCustomerId: sub.customer },
            ],
          },
        });

        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              tier: 'FREE',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
            },
          });
          console.log(`🔻 Organization ${org.id} subscription canceled. Reverted to FREE tier.`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Error handling webhook event:', err);
    return res.status(500).json({ error: 'Server error processing webhook' });
  }
};

module.exports = { handleStripeWebhook };
