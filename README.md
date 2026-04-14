# Vastra Express 

![Monorepo](https://img.shields.io/badge/Monorepo-Yes-1f6feb)
![Backend](https://img.shields.io/badge/Backend-NestJS-e0234e)
![Web](https://img.shields.io/badge/Web-Next.js-111111)
![Mobile](https://img.shields.io/badge/Mobile-Expo-4630EB)
![Database](https://img.shields.io/badge/Database-MySQL-00758F)
![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748)
![Status](https://img.shields.io/badge/Version-V2-success)

Operational platform for laundry logistics and fulfillment with separate apps for Admin, Facility, Driver, and Customer experiences.

---

## Tags

`laundry-tech` `quick-commerce` `nextjs` `nestjs` `expo` `react-native` `prisma` `mysql` `typescript` `operations-platform`

---

## What this project is

Vastra Express is a multi-application system that manages the full laundry lifecycle:

- order intake and tracking
- facility-side processing
- delivery assignment and fulfillment
- inventory operations and low-stock controls
- analytics and operational reporting

This repository is aligned to **V2**, where financial flows were intentionally removed to keep the platform focused on operations.

---

## V2 migration highlights

### Removed in V2

- Billing modules (backend + UI)
- Payments modules (backend + UI)
- Subscriptions modules (backend + UI)

### Active in V2

- Auth + RBAC
- Orders + status state machine
- Inventory + transaction logs + low-stock reporting
- Facility pipeline
- Driver assignment + delivery flow
- Reports + notifications

For migration details, see [V2_MIGRATION_GUIDE.md](V2_MIGRATION_GUIDE.md).

---

## Monorepo layout

| App | Purpose | Default Port |
|---|---|---|
| `vastra-express-backend` | NestJS REST API + Prisma | `3000` (`/api`) |
| `vastra-express-admin` | Admin dashboard (Next.js) | `3001` |
| `vastra-express-facility` | Facility dashboard (Next.js) | `3002` |
| `vastra-express-driver-web` | Driver web app (Next.js) | `3003` |
| `vastra-express-customer-web` | Customer web app (Next.js) | `3004` |
| `vastra-express-customer` | Customer mobile app (Expo) | Expo runtime |
| `vastra-express-driver` | Driver mobile app (Expo) | Expo runtime |

---

## Core operational workflow

Typical order progression:

`ORDER_CREATED → ORDER_CONFIRMED → PICKUP_* → RECEIVED_AT_FACILITY → SORTING → WASHING → READY_FOR_DISPATCH → DELIVERY_* → DELIVERED`

Notes:

- legacy intermediary statuses like `IRONING` / `PACKING` can exist in history
- in V2 processing paths converge to `READY_FOR_DISPATCH`

---

## Tech stack

### Backend

- NestJS 11
- Prisma ORM
- MySQL
- JWT auth + role guards

### Web

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Zustand + Axios

### Mobile

- Expo + React Native
- Expo Router

---

## Quick start (Windows)

### 1) Clone and install

Install dependencies in each app you plan to run.

Minimum set for local web stack:

- `vastra-express-backend`
- `vastra-express-admin`
- `vastra-express-facility`
- `vastra-express-driver-web`
- `vastra-express-customer-web`

### 2) Configure environment

Create `.env` files where needed.

Backend minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (optional, defaults to `3000`)

### 3) Prepare DB

Inside `vastra-express-backend`:

- `npx prisma generate`
- `npx prisma migrate dev`

### 4) Start all major services

From repo root:

- `./start-all.ps1`

This starts backend + all key web apps in separate terminals.

---

## Project documentation

- [V2_MIGRATION_GUIDE.md](V2_MIGRATION_GUIDE.md) — migration decisions and status
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) — implementation planning

---

## Security and repository hygiene

- secrets and env files are ignored via [.gitignore](.gitignore)
- build output and caches for Next.js / Expo / turbo are ignored
- repo is structured for operational deployment and iterative feature rollout

---

## Contribution notes

When changing workflow-critical modules (orders, inventory, delivery):

1. update backend contracts first
2. align admin/facility/customer/driver clients
3. verify state transitions in end-to-end flow
4. document migration-impacting changes in `V2_MIGRATION_GUIDE.md`
