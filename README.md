# Vastra Express (V2)

Multi-app laundry operations platform with web dashboards and mobile apps.

## Apps in this repository

- `vastra-express-backend` — NestJS + Prisma API (`http://localhost:3000/api`)
- `vastra-express-admin` — Next.js Admin Portal (`http://localhost:3001`)
- `vastra-express-facility` — Next.js Facility Portal (`http://localhost:3002`)
- `vastra-express-driver-web` — Next.js Driver Web Portal (`http://localhost:3003`)
- `vastra-express-customer-web` — Next.js Customer Web Portal (`http://localhost:3004`)
- `vastra-express-customer` — Expo React Native Customer App
- `vastra-express-driver` — Expo React Native Driver App

## V2 migration status

This repository is now on **V2 operational flow**.

### Removed from codebase

- Billing module
- Payments module
- Subscriptions module
- Related dashboard pages and API routes

### Active operational domains

- Authentication and RBAC
- Orders and status workflow
- Inventory and low-stock tracking
- Facility processing operations
- Driver assignment and delivery flow
- Reporting and notifications

## Current order flow (V2)

Primary operational progression:

`ORDER_CREATED → ... → RECEIVED_AT_FACILITY → SORTING → WASHING → READY_FOR_DISPATCH → DELIVERY_ASSIGNED → OUT_FOR_DELIVERY → DELIVERED`

Legacy internal statuses (`IRONING`, `PACKING`) are still recognized where needed but operationally converge to `READY_FOR_DISPATCH`.

## Quick start

### 1) Install dependencies

Install dependencies inside each app folder you plan to run:

- `vastra-express-backend`
- `vastra-express-admin`
- `vastra-express-facility`
- `vastra-express-driver-web`
- `vastra-express-customer-web`
- (optional) Expo apps: `vastra-express-customer`, `vastra-express-driver`

### 2) Configure environment

Create `.env` files where required (especially backend and web apps).

Backend minimum variables are typically:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (default `3000`)

### 3) Run database tasks (backend)

From `vastra-express-backend`:

- `npx prisma generate`
- `npx prisma migrate dev`

### 4) Start all core web services (Windows)

From repo root:

- `./start-all.ps1`

This opens separate terminals for backend, admin, facility, driver web, and customer web.

## Useful docs

- `V2_MIGRATION_GUIDE.md` — migration scope and notes
- `IMPLEMENTATION_GUIDE.md` — implementation planning notes

## Tech stack

- Backend: NestJS, Prisma, MySQL
- Web: Next.js (App Router), TypeScript, Tailwind
- Mobile: Expo, React Native, TypeScript

## Repository notes

- Secrets are ignored via `.gitignore`
- Build artifacts and caches are ignored for Next.js, Expo, and monorepo tooling

---

If you are onboarding, start with `V2_MIGRATION_GUIDE.md` and then run `./start-all.ps1`.
