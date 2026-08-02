const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireOrgMember = require('../middleware/requireOrgMember');
const requireAdmin = require('../middleware/requireAdmin');
const {
  createCheckoutSession,
  createPortalSession,
} = require('../controllers/billingController');

// Mounted at /api/orgs/:orgId/billing
const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireOrgMember);
router.use(requireAdmin); // Admin-only access

router.post('/checkout', createCheckoutSession);
router.post('/portal', createPortalSession);

module.exports = router;
