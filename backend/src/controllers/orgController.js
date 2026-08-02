const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * POST /api/orgs
 * Creates a new organization. The authenticated user is automatically set as ADMIN.
 */
const createOrg = async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Organization name is required.' });
  }

  try {
    // Use a transaction to create the org and add the creator as ADMIN atomically
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: name.trim() },
      });

      await tx.orgMember.create({
        data: {
          userId: req.user.userId,
          organizationId: org.id,
          role: 'ADMIN',
        },
      });

      return org;
    });

    return res.status(201).json({ organization: result });
  } catch (err) {
    console.error('createOrg error:', err);
    return res.status(500).json({ error: 'Server error creating organization.' });
  }
};

/**
 * GET /api/orgs
 * Lists all organizations the authenticated user belongs to.
 */
const listOrgs = async (req, res) => {
  try {
    const memberships = await prisma.orgMember.findMany({
      where: { userId: req.user.userId },
      include: {
        organization: true,
      },
      orderBy: { joinedAt: 'asc' },
    });

    const orgs = memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      createdAt: m.organization.createdAt,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return res.status(200).json({ orgs });
  } catch (err) {
    console.error('listOrgs error:', err);
    return res.status(500).json({ error: 'Server error listing organizations.' });
  }
};

module.exports = { createOrg, listOrgs };
