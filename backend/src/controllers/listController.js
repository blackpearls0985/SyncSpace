const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require('../utils/activityLogger');
const { getIO } = require('../socket');

/**
 * POST /api/orgs/:orgId/boards/:boardId/lists
 * Create list.
 */
const createList = async (req, res) => {
  const { orgId, boardId } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'List name is required.' });
  }

  try {
    const board = await prisma.board.findFirst({
      where: { id: boardId, organizationId: orgId },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found in this organization.' });
    }

    const lastList = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
    });

    const newPosition = lastList ? lastList.position + 65535.0 : 65535.0;

    const list = await prisma.list.create({
      data: {
        name: name.trim(),
        boardId,
        position: newPosition,
      },
      include: { cards: true },
    });

    await logActivity({
      organizationId: orgId,
      boardId,
      userId: req.user.userId,
      action: `added list "${list.name}" to board "${board.name}"`,
    });

    const io = getIO();
    if (io) {
      io.to(`board:${boardId}`).emit('list:created', { list });
    }

    return res.status(201).json({ list });
  } catch (err) {
    console.error('createList error:', err);
    return res.status(500).json({ error: 'Failed to create list.' });
  }
};

/**
 * PATCH /api/orgs/:orgId/lists/:listId
 * Rename list.
 */
const updateList = async (req, res) => {
  const { orgId, listId } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'List name is required.' });
  }

  try {
    const list = await prisma.list.findFirst({
      where: { id: listId, board: { organizationId: orgId } },
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found in this organization.' });
    }

    const updated = await prisma.list.update({
      where: { id: listId },
      data: { name: name.trim() },
    });

    await logActivity({
      organizationId: orgId,
      boardId: list.boardId,
      userId: req.user.userId,
      action: `renamed list from "${list.name}" to "${updated.name}"`,
    });

    const io = getIO();
    if (io) {
      io.to(`board:${list.boardId}`).emit('list:updated', { list: updated });
    }

    return res.status(200).json({ list: updated });
  } catch (err) {
    console.error('updateList error:', err);
    return res.status(500).json({ error: 'Failed to update list.' });
  }
};

/**
 * DELETE /api/orgs/:orgId/lists/:listId
 * Delete list.
 */
const deleteList = async (req, res) => {
  const { orgId, listId } = req.params;

  try {
    const list = await prisma.list.findFirst({
      where: { id: listId, board: { organizationId: orgId } },
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found in this organization.' });
    }

    const boardId = list.boardId;
    const listName = list.name;

    await prisma.list.delete({ where: { id: listId } });

    await logActivity({
      organizationId: orgId,
      boardId,
      userId: req.user.userId,
      action: `deleted list "${listName}"`,
    });

    const io = getIO();
    if (io) {
      io.to(`board:${boardId}`).emit('list:deleted', { listId });
    }

    return res.status(200).json({ message: 'List deleted successfully.' });
  } catch (err) {
    console.error('deleteList error:', err);
    return res.status(500).json({ error: 'Failed to delete list.' });
  }
};

/**
 * PATCH /api/orgs/:orgId/lists/:listId/position
 * Reorder list.
 */
const updateListPosition = async (req, res) => {
  const { orgId, listId } = req.params;
  const { position } = req.body;

  if (typeof position !== 'number') {
    return res.status(400).json({ error: 'Valid numeric position is required.' });
  }

  try {
    const list = await prisma.list.findFirst({
      where: { id: listId, board: { organizationId: orgId } },
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found in this organization.' });
    }

    const updated = await prisma.list.update({
      where: { id: listId },
      data: { position },
    });

    await logActivity({
      organizationId: orgId,
      boardId: list.boardId,
      userId: req.user.userId,
      action: `reordered list "${list.name}"`,
    });

    const io = getIO();
    if (io) {
      io.to(`board:${list.boardId}`).emit('list:reordered', { list: updated });
    }

    return res.status(200).json({ list: updated });
  } catch (err) {
    console.error('updateListPosition error:', err);
    return res.status(500).json({ error: 'Failed to update list position.' });
  }
};

module.exports = {
  createList,
  updateList,
  deleteList,
  updateListPosition,
};
