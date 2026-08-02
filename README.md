# SyncSpace — Team Collaboration Tool

A SaaS-style team collaboration tool built as a portfolio/interview project. Features user auth, organization multi-tenancy, RBAC, kanban boards with drag-and-drop, room-based Socket.io real-time sync, a live activity feed, and a complete Stripe subscription integration.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Tailwind CSS, React Router v6, `@dnd-kit`, `socket.io-client` |
| Backend | Node.js, Express, Socket.io, Stripe Node SDK |
| Database | PostgreSQL |
| ORM | Prisma v5 |
| Auth | JWT (httpOnly cookies) + bcrypt |

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL running locally (port 5432) with database `saas_collab`

### 1. Clone and install

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Set up the database

```bash
cd backend
npx prisma migrate dev
```

This creates all tables: `User`, `Organization`, `OrgMember`, `PendingInvite`, `Board`, `List`, `Card`, `ActivityLog`.

### 3. Start both servers

```bash
# Terminal 1 — backend HTTP & Socket.io server (port 3001)
cd backend
npm run dev

# Terminal 2 — frontend Vite dev server (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173

---

## Billing & Subscription Architecture

### Why Stripe Checkout (Hosted) over Custom Card Forms?
1. **PCI DSS Compliance**: Using Stripe Checkout means credit card numbers are entered directly into Stripe's secure iframe/hosted domain. Raw card details **never touch our application servers**, eliminating PCI Compliance scope.
2. **Production standard**: Hosted Checkout handles 3D Secure authentication (SCA), Apple Pay/Google Pay, and localized currencies out of the box.

### Why Webhooks are the Sole Source of Truth for Subscription State
A common beginner flaw in payment integration is trusting the client-side redirect (`/settings?success=true`) to set `tier = 'PRO'` in the database.
- **Flaw**: A user can open `/settings?success=true` directly without paying, or close their browser tab before the redirect completes.
- **Solution**: The frontend redirect only shows a temporary UI notice. The backend **ONLY** updates `Organization.tier` and `subscriptionStatus` inside the `POST /api/webhooks/stripe` webhook handler after verifying the cryptographic signature (`stripe.webhooks.constructEvent`).

### Handled Webhook Events
- `checkout.session.completed`: Upgrades organization `tier` to `PRO`, saves `stripeCustomerId` and `stripeSubscriptionId`.
- `customer.subscription.updated`: Keeps `subscriptionStatus` in sync (`active`, `past_due`, etc.).
- `customer.subscription.deleted`: Reverts organization `tier` back to `FREE` and sets status to `canceled`.

---

## Real-Time Architecture: Room-Based Broadcasting

### Why Room-Based Broadcasting instead of Global Broadcast?
1. **Security / Multi-tenancy**: Sockets belonging to User A in Organization 1 must **never** receive real-time board updates or card movements from Organization 2.
2. **Network Efficiency**: Rooms ensure WebSocket messages are delivered strictly to sockets viewing that specific board (`board:${boardId}`).

### Single Source of Truth: REST API + Socket Emission
- HTTP requests perform the database mutation in PostgreSQL.
- On success, the server logs the action to `ActivityLog` and broadcasts the event to `io.to('board:${boardId}')`.
- Automatic full state resync on socket reconnect.

---

## Auth & RBAC Architecture

### Why httpOnly cookies instead of localStorage?
JWTs stored in `localStorage` are vulnerable to XSS attacks. An `httpOnly` cookie cannot be read by JavaScript — the browser attaches it automatically on each HTTP and WebSocket request.

---

## API Reference

| Method | Path | Auth | Admin | Description |
|--------|------|------|-------|-------------|
| POST | `/api/auth/signup` | ❌ | — | Register + auto-login |
| POST | `/api/auth/login` | ❌ | — | Login, set JWT cookie |
| POST | `/api/auth/logout` | ✅ | — | Clear cookie |
| GET | `/api/auth/me` | ✅ | — | Current user + all orgs |
| POST | `/api/orgs` | ✅ | — | Create org (caller → ADMIN) |
| GET | `/api/orgs` | ✅ | — | List caller's orgs |
| GET | `/api/orgs/:orgId/members` | ✅ | — | List members |
| POST | `/api/orgs/:orgId/members/invite` | ✅ | **✅** | Invite by email |
| DELETE | `/api/orgs/:orgId/members/:memberId` | ✅ | **✅** | Remove member |
| PATCH | `/api/orgs/:orgId/members/:memberId/role` | ✅ | **✅** | Change role |
| GET | `/api/orgs/:orgId/boards` | ✅ | — | List org boards |
| POST | `/api/orgs/:orgId/boards` | ✅ | — | Create board |
| GET | `/api/orgs/:orgId/boards/:boardId` | ✅ | — | Get board with lists & cards |
| GET | `/api/orgs/:orgId/boards/:boardId/activity` | ✅ | — | Get activity logs (10 FREE / 50 PRO) |
| POST | `/api/orgs/:orgId/billing/checkout` | ✅ | **✅** | Create Stripe Checkout session |
| POST | `/api/orgs/:orgId/billing/portal` | ✅ | **✅** | Create Stripe Billing Portal session |
| POST | `/api/webhooks/stripe` | ❌ | — | Stripe webhook handler (raw body verified) |
