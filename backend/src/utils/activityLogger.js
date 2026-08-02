const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getIO } = require('../socket');

/**
 * logActivity
 * Logs a human-readable action to the database and broadcasts activity:new to the board room.
 */
async function logActivity({ organizationId, boardId, userId, action }) {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        organizationId,
        boardId,
        userId,
        action,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Broadcast activity to the board room
    if (boardId) {
      const io = getIO();
      if (io) {
        io.to(`board:${boardId}`).emit('activity:new', activity);
      }
    }

    return activity;
  } catch (err) {
    console.error('logActivity error:', err);
    return null;
  }
}

module.exports = { logActivity };
