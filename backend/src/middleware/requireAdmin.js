const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * requireAdmin middleware
 *
 * Must be used AFTER the `authenticate` middleware so req.user is set.
 * Expects req.params.orgId to be present (set by the route).
 *
 * Checks that the authenticated user is an ADMIN of the given org.
 * Returns:
 *   - 400 if orgId param is missing
 *   - 403 if the user is not a member or not an ADMIN of the org
 *
 * Why server-side? Hiding invite/remove buttons in the UI is UX, not security.
 * A MEMBER can call these endpoints directly (e.g., via Postman) and must be rejected.
 */
const requireAdmin = async (req, res, next) => {
  const { orgId } = req.params;

  if (!orgId) {
    return res.status(400).json({ error: 'orgId param is required.' });
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

    if (membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin role required for this action.' });
    }

    // Attach membership to req for downstream use
    req.membership = membership;
    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = requireAdmin;
