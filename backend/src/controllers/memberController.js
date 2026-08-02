const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/orgs/:orgId/members
 * Lists all members of the organization.
 * Accessible to any authenticated member (not admin-only).
 */
const listMembers = async (req, res) => {
  const { orgId } = req.params;

  try {
    // Verify the requesting user is a member of this org
    const callerMembership = await prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.userId,
          organizationId: orgId,
        },
      },
    });

    if (!callerMembership) {
      return res.status(403).json({ error: 'You are not a member of this organization.' });
    }

    const members = await prisma.orgMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const formatted = members.map((m) => ({
      memberId: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    }));

    return res.status(200).json({ members: formatted });
  } catch (err) {
    console.error('listMembers error:', err);
    return res.status(500).json({ error: 'Server error listing members.' });
  }
};

/**
 * POST /api/orgs/:orgId/members/invite
 * Admin-only (enforced by requireAdmin middleware).
 *
 * If the invited email has an account → add as MEMBER immediately.
 * If not → create a PendingInvite with a unique token and log the invite link.
 */
const inviteMember = async (req, res) => {
  const { orgId } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      // Check if already a member
      const alreadyMember = await prisma.orgMember.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId: orgId,
          },
        },
      });

      if (alreadyMember) {
        return res.status(409).json({ error: 'This user is already a member of the organization.' });
      }

      // Add as MEMBER immediately
      const membership = await prisma.orgMember.create({
        data: {
          userId: existingUser.id,
          organizationId: orgId,
          role: 'MEMBER',
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      return res.status(201).json({
        message: `${existingUser.name} has been added as a member.`,
        member: {
          memberId: membership.id,
          role: membership.role,
          joinedAt: membership.joinedAt,
          user: membership.user,
        },
      });
    } else {
      // No account found — create a pending invite
      // Remove any existing pending invite for this email + org
      await prisma.pendingInvite.deleteMany({
        where: { email: normalizedEmail, organizationId: orgId },
      });

      const invite = await prisma.pendingInvite.create({
        data: {
          email: normalizedEmail,
          organizationId: orgId,
          invitedById: req.user.userId,
        },
      });

      // In production this would be sent via email. For now, log to console.
      const inviteLink = `${process.env.CLIENT_URL}/signup?invite=${invite.token}&email=${encodeURIComponent(normalizedEmail)}`;
      console.log(`\n📧 INVITE LINK (would be emailed in production):`);
      console.log(`   Email: ${normalizedEmail}`);
      console.log(`   Link:  ${inviteLink}\n`);

      return res.status(200).json({
        message: `No account found for ${normalizedEmail}. A pending invite has been created.`,
        inviteLink, // Returned in dev so you can test it easily
      });
    }
  } catch (err) {
    console.error('inviteMember error:', err);
    return res.status(500).json({ error: 'Server error inviting member.' });
  }
};

/**
 * DELETE /api/orgs/:orgId/members/:memberId
 * Admin-only (enforced by requireAdmin middleware).
 * Removes a member from the organization.
 */
const removeMember = async (req, res) => {
  const { orgId, memberId } = req.params;

  try {
    const membership = await prisma.orgMember.findUnique({
      where: { id: memberId },
    });

    if (!membership || membership.organizationId !== orgId) {
      return res.status(404).json({ error: 'Member not found in this organization.' });
    }

    // Prevent removing the last admin
    if (membership.role === 'ADMIN') {
      const adminCount = await prisma.orgMember.count({
        where: { organizationId: orgId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin of an organization.' });
      }
    }

    // Prevent self-removal (handled in UI but also blocked here)
    if (membership.userId === req.user.userId) {
      return res.status(400).json({ error: 'You cannot remove yourself. Transfer admin first.' });
    }

    await prisma.orgMember.delete({ where: { id: memberId } });

    return res.status(200).json({ message: 'Member removed successfully.' });
  } catch (err) {
    console.error('removeMember error:', err);
    return res.status(500).json({ error: 'Server error removing member.' });
  }
};

/**
 * PATCH /api/orgs/:orgId/members/:memberId/role
 * Admin-only (enforced by requireAdmin middleware).
 * Changes a member's role between ADMIN and MEMBER.
 */
const changeMemberRole = async (req, res) => {
  const { orgId, memberId } = req.params;
  const { role } = req.body;

  if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
    return res.status(400).json({ error: 'Role must be either ADMIN or MEMBER.' });
  }

  try {
    const membership = await prisma.orgMember.findUnique({
      where: { id: memberId },
    });

    if (!membership || membership.organizationId !== orgId) {
      return res.status(404).json({ error: 'Member not found in this organization.' });
    }

    // Prevent demoting the last admin
    if (membership.role === 'ADMIN' && role === 'MEMBER') {
      const adminCount = await prisma.orgMember.count({
        where: { organizationId: orgId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last admin. Promote another member first.' });
      }
    }

    const updated = await prisma.orgMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({
      message: `Role updated to ${role}.`,
      member: {
        memberId: updated.id,
        role: updated.role,
        joinedAt: updated.joinedAt,
        user: updated.user,
      },
    });
  } catch (err) {
    console.error('changeMemberRole error:', err);
    return res.status(500).json({ error: 'Server error changing role.' });
  }
};

module.exports = { listMembers, inviteMember, removeMember, changeMemberRole };
