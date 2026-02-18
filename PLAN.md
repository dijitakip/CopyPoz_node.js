# CopyPoz Migration and Development Plan

This document outlines the detailed steps to migrate the PHP-based CopyPoz Dashboard to a Node.js ecosystem (Next.js + Prisma) compatible with Hostinger and GitHub Import.

## Goals
1.  **Framework Migration**: Move from PHP to Next.js (App Router) + Node.js (v22.x).
2.  **Domain Independence**: Ensure no hardcoded domains exist; use relative paths and environment variables.
3.  **Monorepo Structure**: `apps/frontend` (Next.js) + `packages/backend-core` (Business Logic) + `packages/shared`.
4.  **Deployment**: Ready for "GitHub Import" on Hostinger (single `npm start` command).

---

## Phase 1: Project Initialization & Structure (Completed)
- [x] Create Monorepo skeleton (Workspaces: `apps/*`, `packages/*`).
- [x] Initialize `apps/frontend` (Next.js 14).
- [x] Initialize `packages/backend-core` (TypeScript).
- [x] Initialize `packages/shared` (TypeScript).

## Phase 2: Database & Backend Core
### 2.1 Prisma Setup
- [ ] Define `schema.prisma` in `packages/backend-core` matching the existing MySQL schema (`database_complete.sql`).
- [ ] Configure `DATABASE_URL` in `.env`.
- [ ] Generate Prisma Client.

### 2.2 Core Services (Business Logic)
- [ ] **AuthService**:
    - Implement login logic using `users` table.
    - Support legacy SHA-256 password verification + rehash to Bcrypt/Argon2.
    - Session management (HTTP-only cookies).
- [ ] **ClientService**:
    - CRUD for `clients` table.
    - Token generation/validation for EA.
- [ ] **MasterService**:
    - Manage `master_state` and positions.
    - Command queue logic.
- [ ] **LicenseService**:
    - License validation logic.

## Phase 3: API Layer (Next.js Route Handlers)
Migrate PHP endpoints to Next.js API Routes (`apps/frontend/app/api/...`).

- [ ] **Auth**: `POST /api/auth/login`, `POST /api/auth/logout`.
- [ ] **EA Endpoints** (Bearer Token Guard):
    - `GET /api/clients` -> `ClientService.list()`
    - `GET /api/positions` -> `MasterService.getPositions()`
    - `POST /api/client` -> `ClientService.registerOrUpdate()`
    - `POST /api/license-check` -> `LicenseService.check()`
- [ ] **Command Endpoints**:
    - `GET/POST /api/master-command`
    - `GET/POST /api/client-command`
- [ ] **Admin/Dashboard Data**:
    - `GET /api/dashboard/stats` (Aggregated stats for UI).

## Phase 4: Frontend UI Implementation
Replicate the existing Dashboard UI using React/Next.js components.

- [ ] **Authentication**:
    - Login Page (`/login`) with form handling.
    - Middleware for route protection (`/dashboard`, `/admin/*`).
- [ ] **Dashboard**:
    - Main Dashboard (`/dashboard`) showing Master Status, Connected Clients, Stats.
    - Auto-refresh mechanism (SWR or polling).
- [ ] **Admin Pages**:
    - Users Management (`/admin/users`).
    - Clients Management (`/admin/clients`).
    - Master Groups (`/admin/master-groups`).
    - Tokens (`/admin/tokens`).
    - Licenses (`/admin/licenses`).
- [ ] **Shared Components**:
    - Navbar (Bootstrap-like styling).
    - Status Badges.
    - Data Tables.

## Phase 5: PWA & Service Worker
- [ ] Configure `next-pwa` in `next.config.js`.
- [ ] Create `public/manifest.json` (Domain independent).
- [ ] Implement Service Worker logic (Cache strategies, `chrome-extension` filtering).

## Phase 6: Deployment & Verification
- [ ] Create production build script (`npm run build` at root).
- [ ] Verify `npm start` launches the full application.
- [ ] Test environment variables on Hostinger.
- [ ] Verify API endpoints with existing EA tools (using the new URL).

---

## Environment Variables (Template)
```env
# Database
DATABASE_URL="mysql://user:password@host:3306/db_name"

# Security
MASTER_TOKEN="YOUR_MASTER_TOKEN"
SESSION_SECRET="complex_session_secret_key"
NODE_ENV="production"

# App
NEXT_PUBLIC_APP_URL="https://your-domain.com" # Optional, mostly for absolute links if needed
```
