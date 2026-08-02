require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PORT, CLIENT_ORIGIN } = require('./config');
const { initSocket } = require('./socket');

const authRoutes = require('./routes/auth');
const orgRoutes = require('./routes/orgs');
const memberRoutes = require('./routes/members');
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');
const billingRoutes = require('./routes/billing');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io server attached to HTTP server
initSocket(server);

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true, // Required to allow cookies to be sent cross-origin
}));

// IMPORTANT: Webhook routes must mount BEFORE express.json() for raw body signature verification
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgRoutes);

// Member routes: /api/orgs/:orgId/members
app.use('/api/orgs/:orgId/members', memberRoutes);

// Billing routes: /api/orgs/:orgId/billing
app.use('/api/orgs/:orgId/billing', billingRoutes);

// Board routes: /api/orgs/:orgId/boards
app.use('/api/orgs/:orgId/boards', boardRoutes);

// List & Card routes: /api/orgs/:orgId/lists & /api/orgs/:orgId/cards
app.use('/api/orgs/:orgId', listRoutes);
app.use('/api/orgs/:orgId', cardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// ─── Start HTTP & Socket Server ──────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`\n🚀 Backend HTTP & Socket.io server running at http://localhost:${PORT}`);
  console.log(`   Accepting requests from: ${CLIENT_ORIGIN}\n`);
});
