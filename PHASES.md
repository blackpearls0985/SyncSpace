# Project Phases — All 4 Phases Complete 🎉

## ✅ Phase 1 — Foundation: Auth + Orgs + RBAC (Completed)
- User signup / login / logout (JWT in httpOnly cookies, bcrypt)
- Create organization → creator becomes ADMIN
- Invite member by email (immediate if account exists, pending invite link if not)
- Org switcher UI (dropdown for multi-org users)
- Role-based middleware: ADMIN-only routes enforced server-side (403 for MEMBERs)
- Pages: /signup, /login, /dashboard, /org/:orgId/settings

## ✅ Phase 2 — Boards, Lists, Cards & Drag-and-Drop (Completed)
- **Board Model**: Belong to org, list view per org, delete restriction (admin or creator)
- **List Model**: Horizontal scroll container, position float field for O(1) fractional positioning
- **Card Model**: Title, description, assignee (dropdown of org members), due date, position float field
- **Drag-and-Drop**: Built with `@dnd-kit/core` and `@dnd-kit/sortable`
  - Reorder cards within the same list or across lists
  - Reorder lists horizontally
  - Fractional positioning (`newPos = (prev + next) / 2`) prevents updating every sibling row
  - Optimistic UI updates with rollback on API failure
- **Strict Multi-Tenant Security**: `requireOrgMember` middleware rejects cross-org API calls with 403 Forbidden
- **Pages**: `/org/:orgId/boards` (boards index) and `/org/:orgId/boards/:boardId` (Kanban board view)

## ✅ Phase 3 — Real-Time Collaboration & Activity Log (Completed)
- **Socket.io Real-Time Engine**:
  - JWT authentication during socket handshake (HTTP-only cookies parsed)
  - Room-based broadcasting: `join-board` gatekeeper verifies user org membership before joining room `board:${boardId}`
  - Events: `card:created`, `card:updated`, `card:moved`, `card:deleted`, `list:created`, `list:updated`, `list:reordered`, `list:deleted`, `board:renamed`, `activity:new`
  - Single source of truth: REST API performs DB writes, then server emits events to room sockets
  - Reconnection resilience: auto-refetches board state on socket reconnect to prevent stale UI
- **Activity Log & Live Feed**:
  - Prisma `ActivityLog` model tracking user actions with human-readable descriptions
  - Endpoint: `GET /api/orgs/:orgId/boards/:boardId/activity` (returns last 50 entries)
  - `ActivityFeed.jsx` collapsible sidebar component rendering live activity updates with relative timestamps

## ✅ Phase 4 — Billing & Subscriptions (Stripe) (Completed)
- **Data Model**: `Organization.tier` enum (`FREE`, `PRO`), `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`.
- **Stripe Checkout & Billing Portal**:
  - Admin-only routes: `POST /api/orgs/:orgId/billing/checkout` & `POST /api/orgs/:orgId/billing/portal`.
  - Redirects callers to Stripe-hosted payment and portal management pages.
- **Webhook Source of Truth (`/api/webhooks/stripe`)**:
  - Raw body signature verification using `stripe.webhooks.constructEvent`.
  - Handles `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
  - Subscription status is **only** updated via webhooks, never directly from client redirects.
- **Server-Side Feature Gating**:
  - `getActivityLogs` checks `org.tier`: returns 10 entries for `FREE` vs 50 entries for `PRO`.
  - UI displays a Pro upgrade callout when truncated on Free tier.
