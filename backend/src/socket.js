const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET, CLIENT_ORIGIN } = require('./config');

const prisma = new PrismaClient();

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: CLIENT_ORIGIN,
      credentials: true,
    },
  });

  // JWT Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      let token = null;

      // Extract token from cookies in handshake request headers
      if (socket.request.headers.cookie) {
        const cookies = cookie.parse(socket.request.headers.cookie);
        token = cookies.token;
      }

      // Fallback to handshake auth payload
      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded; // { userId, email }
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user?.email})`);

    // Room-based join handler with strict server-side org authorization
    socket.on('join-board', async ({ boardId, orgId }) => {
      if (!boardId || !orgId) {
        return socket.emit('error', { message: 'boardId and orgId are required to join room.' });
      }

      try {
        // Verify user belongs to the org
        const membership = await prisma.orgMember.findUnique({
          where: {
            userId_organizationId: {
              userId: socket.user.userId,
              organizationId: orgId,
            },
          },
        });

        if (!membership) {
          console.warn(`🔒 Unauthorized room join attempt by ${socket.user.email} for org ${orgId}`);
          return socket.emit('error', { message: 'Access denied. You are not a member of this organization.' });
        }

        // Verify board belongs to the org
        const board = await prisma.board.findFirst({
          where: { id: boardId, organizationId: orgId },
        });

        if (!board) {
          return socket.emit('error', { message: 'Board not found in this organization.' });
        }

        const roomName = `board:${boardId}`;
        socket.join(roomName);
        console.log(`📡 Socket ${socket.id} joined room ${roomName}`);
        socket.emit('joined-room', { room: roomName, boardId });
      } catch (err) {
        console.error('Error joining board room:', err);
        socket.emit('error', { message: 'Server error authorizing room access.' });
      }
    });

    socket.on('leave-board', ({ boardId }) => {
      if (boardId) {
        const roomName = `board:${boardId}`;
        socket.leave(roomName);
        console.log(`👋 Socket ${socket.id} left room ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

/**
 * Broadcasts a real-time event to all sockets in a board room.
 * Optionally excludes the sender socketId if provided.
 */
function broadcastToBoard(boardId, event, data, senderSocketId = null) {
  if (!io) return;
  const room = `board:${boardId}`;
  if (senderSocketId) {
    socket.to(room).emit(event, data);
  } else {
    io.to(room).emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  broadcastToBoard,
};
