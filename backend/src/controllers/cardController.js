const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require('../utils/activityLogger');
const { getIO } = require('../socket');

/**
 * POST /api/orgs/:orgId/lists/:listId/cards
 * Create card.
 */
const createCard = async (req, res) => {
  const { orgId, listId } = req.params;
  const { title, description } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Card title is required.' });
  }

  try {
    const list = await prisma.list.findFirst({
      where: { id: listId, board: { organizationId: orgId } },
      include: { board: true },
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found in this organization.' });
    }

    const lastCard = await prisma.card.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
    });

    const newPosition = lastCard ? lastCard.position + 65535.0 : 65535.0;

    const card = await prisma.card.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        listId,
        position: newPosition,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      organizationId: orgId,
      boardId: list.boardId,
      userId: req.user.userId,
      action: `added card "${card.title}" to list "${list.name}"`,
    });

    const io = getIO();
    if (io) {
      io.to(`board:${list.boardId}`).emit('card:created', { card, listId });
    }

    return res.status(201).json({ card });
  } catch (err) {
    console.error('createCard error:', err);
    return res.status(500).json({ error: 'Failed to create card.' });
  }
};

/**
 * GET /api/orgs/:orgId/cards/:cardId
 * Get single card.
 */
const getCardById = async (req, res) => {
  const { orgId, cardId } = req.params;

  try {
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        list: { board: { organizationId: orgId } },
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found in this organization.' });
    }

    return res.status(200).json({ card });
  } catch (err) {
    console.error('getCardById error:', err);
    return res.status(500).json({ error: 'Failed to fetch card details.' });
  }
};

/**
 * PATCH /api/orgs/:orgId/cards/:cardId
 * Update card details.
 */
const updateCard = async (req, res) => {
  const { orgId, cardId } = req.params;
  const { title, description, assigneeId, dueDate } = req.body;

  try {
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        list: { board: { organizationId: orgId } },
      },
      include: { list: true },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found in this organization.' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      organizationId: orgId,
      boardId: card.list.boardId,
      userId: req.user.userId,
      action: `updated card "${updated.title}"`,
    });

    const io = getIO();
    if (io) {
      io.to(`board:${card.list.boardId}`).emit('card:updated', { card: updated });
    }

    return res.status(200).json({ card: updated });
  } catch (err) {
    console.error('updateCard error:', err);
    return res.status(500).json({ error: 'Failed to update card.' });
  }
};

/**
 * DELETE /api/orgs/:orgId/cards/:cardId
 * Delete card.
 */
const deleteCard = async (req, res) => {
  const { orgId, cardId } = req.params;

  try {
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        list: { board: { organizationId: orgId } },
      },
      include: { list: true },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found in this organization.' });
    }

    const boardId = card.list.boardId;
    const cardTitle = card.title;
    const listId = card.listId;

    await prisma.card.delete({ where: { id: cardId } });

    await logActivity({
      organizationId: orgId,
      boardId,
      userId: req.user.userId,
      action: `deleted card "${cardTitle}"`,
    });

    const io = getIO();
    if (io) {
      io.to(`board:${boardId}`).emit('card:deleted', { cardId, listId });
    }

    return res.status(200).json({ message: 'Card deleted successfully.' });
  } catch (err) {
    console.error('deleteCard error:', err);
    return res.status(500).json({ error: 'Failed to delete card.' });
  }
};

/**
 * PATCH /api/orgs/:orgId/cards/:cardId/position
 * Move card.
 */
const updateCardPosition = async (req, res) => {
  const { orgId, cardId } = req.params;
  const { position, newListId } = req.body;

  if (typeof position !== 'number') {
    return res.status(400).json({ error: 'Valid numeric position is required.' });
  }

  try {
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        list: { board: { organizationId: orgId } },
      },
      include: { list: true },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found in this organization.' });
    }

    const boardId = card.list.boardId;
    const updateData = { position };

    let targetListName = card.list.name;

    if (newListId && newListId !== card.listId) {
      const targetList = await prisma.list.findFirst({
        where: { id: newListId, board: { organizationId: orgId } },
      });

      if (!targetList) {
        return res.status(404).json({ error: 'Target list not found in this organization.' });
      }

      updateData.listId = newListId;
      targetListName = targetList.name;
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    const isCrossList = newListId && newListId !== card.listId;
    const actionMsg = isCrossList
      ? `moved card "${updated.title}" from "${card.list.name}" to "${targetListName}"`
      : `reordered card "${updated.title}"`;

    await logActivity({
      organizationId: orgId,
      boardId,
      userId: req.user.userId,
      action: actionMsg,
    });

    const io = getIO();
    if (io) {
      io.to(`board:${boardId}`).emit('card:moved', { card: updated, previousListId: card.listId });
    }

    return res.status(200).json({ card: updated });
  } catch (err) {
    console.error('updateCardPosition error:', err);
    return res.status(500).json({ error: 'Failed to update card position.' });
  }
};

module.exports = {
  createCard,
  getCardById,
  updateCard,
  deleteCard,
  updateCardPosition,
};
