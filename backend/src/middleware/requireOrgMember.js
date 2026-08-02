const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * requireOrgMember
 *
 * Ensures multi-tenant authorization:
 * Verifies that the authenticated user (`req.user.userId`) is a member
 * of the organization passed in `req.params.orgId`.
 *
 * Returns 403 Forbidden if the user is not a member of the organization.
 */
const requireOrgMember = async (req, res, next) => {
  const orgId = req.params.orgId;

  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required.' });
  }

  try {
    const membership = await prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.userId,
          organizationId: orgId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this organization.' });
    }

    req.membership = membership;
    next();
  } catch (err) {
    console.error('requireOrgMember error:', err);
    return res.status(500).json({ error: 'Internal server error verifying organization access.' });
  }
};

module.exports = requireOrgMember;
