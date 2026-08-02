const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');
const {
  listMembers,
  inviteMember,
  removeMember,
  changeMemberRole,
} = require('../controllers/memberController');

// Note: this router is mounted at /api/orgs/:orgId/members
// mergeParams: true allows access to :orgId from the parent route
const router = express.Router({ mergeParams: true });

// All member routes require authentication
router.use(authenticate);

// Any member can view the member list
router.get('/', listMembers);

// The following routes require ADMIN role — enforced server-side by requireAdmin.
// A MEMBER calling these endpoints directly (e.g., via Postman) will receive a 403.
router.post('/invite', requireAdmin, inviteMember);
router.delete('/:memberId', requireAdmin, removeMember);
router.patch('/:memberId/role', requireAdmin, changeMemberRole);

module.exports = router;
