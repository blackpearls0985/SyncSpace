const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require('../utils/activityLogger');
const { getIO } = require('../socket');

/**
 * POST /api/orgs/:orgId/boards
 * Create a new board.
 */
const createBoard = async (req, res) => {
  const { orgId } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Board name is required.' });
  }

  try {
    const board = await prisma.board.create({
      data: {
        name: name.trim(),
        organizationId: orgId,
        createdById: req.user.userId,
      },
    });

    await logActivity({
      organizationId: orgId,
      boardId: board.id,
      userId: req.user.userId,
      action: `created board "${board.name}"`,
    });

    return res.status(201).json({ board });
  } catch (err) {
    console.error('createBoard error:', err);
    return res.status(500).json({ error: 'Failed to create board.' });
  }
};

/**
 * GET /api/orgs/:orgId/boards
 * List all boards in organization.
 */
const getBoards = async (req, res) => {
  const { orgId } = req.params;

  try {
    const boards = await prisma.board.findMany({
      where: { organizationId: orgId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { lists: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ boards });
  } catch (err) {
    console.error('getBoards error:', err);
    return res.status(500).json({ error: 'Failed to fetch boards.' });
  }
};

/**
 * GET /api/orgs/:orgId/boards/:boardId
 * Get single board details.
 */
const getBoardById = async (req, res) => {
  const { orgId, boardId } = req.params;

  try {
    const board = await prisma.board.findFirst({
      where: { id: boardId, organizationId: orgId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found in this organization.' });
    }

    const orgMemberships = await prisma.orgMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const members = orgMemberships.map((m) => m.user);

    return res.status(200).json({ board, members });
  } catch (err) {
    console.error('getBoardById error:', err);
    return res.status(500).json({ error: 'Failed to fetch board.' });
  }
};

/**
 * PATCH /api/orgs/:orgId/boards/:boardId
 * Rename board.
 */
const updateBoard = async (req, res) => {
  const { orgId, boardId } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Board name is required.' });
  }

  try {
    const existing = await prisma.board.findFirst({
      where: { id: boardId, organizationId: orgId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Board not found in this organization.' });
    }

    const updated = await prisma.board.update({
      where: { id: boardId },
      data: { name: name.trim() },
    });

    await logActivity({
      organizationId: orgId,
      boardId,
      userId: req.user.userId,
      action: `renamed board from "${existing.name}" to "${updated.name}"`,
    });

    const io = getIO();
    if (io) {
      io.to(`board:${boardId}`).emit('board:renamed', { board: updated });
    }

    return res.status(200).json({ board: updated });
  } catch (err) {
    console.error('updateBoard error:', err);
    return res.status(500).json({ error: 'Failed to update board.' });
  }
};

/**
 * DELETE /api/orgs/:orgId/boards/:boardId
 * Delete board.
 */
const deleteBoard = async (req, res) => {
  const { orgId, boardId } = req.params;

  try {
    const board = await prisma.board.findFirst({
      where: { id: boardId, organizationId: orgId },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found in this organization.' });
    }

    const isCreator = board.createdById === req.user.userId;
    const isAdmin = req.membership?.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Only the board creator or an organization Admin can delete this board.' });
    }

    await prisma.board.delete({ where: { id: boardId } });

    await logActivity({
      organizationId: orgId,
      boardId: null,
      userId: req.user.userId,
      action: `deleted board "${board.name}"`,
    });

    return res.status(200).json({ message: 'Board deleted successfully.' });
  } catch (err) {
    console.error('deleteBoard error:', err);
    return res.status(500).json({ error: 'Failed to delete board.' });
  }
};

/**
 * GET /api/orgs/:orgId/boards/:boardId/activity
 * Gets activity logs for a board.
 * Server-side feature gating:
 *   - FREE tier: returns last 10 entries
 *   - PRO tier: returns last 50 entries
 */
const getActivityLogs = async (req, res) => {
  const { orgId, boardId } = req.params;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { tier: true },
    });

    const isPro = org?.tier === 'PRO';
    const limit = isPro ? 50 : 10;

    const activities = await prisma.activityLog.findMany({
      where: { organizationId: orgId, boardId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.status(200).json({ activities, tier: org?.tier || 'FREE', limit });
  } catch (err) {
    console.error('getActivityLogs error:', err);
    return res.status(500).json({ error: 'Failed to fetch activity logs.' });
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  getActivityLogs,
};
