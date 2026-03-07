# WEBSITE_EXTENSION_PLAN.md
# Vastra Express — Customer & Driver Website Extension

**Date:** March 1, 2026  
**Status:** Approved for Implementation  
**Author:** Architecture Team

---

## 1. OVERVIEW OF THE EXTENSION

### 1.1 Purpose

The Vastra Express platform currently serves users through:

| Platform | Technology | Users Served |
|---|---|---|
| Admin Panel | Next.js (port 3001) | Admins |
| Facility Portal | Next.js (port 3002) | Facility Staff |
| Customer Mobile App | Expo (React Native) | Customers |
| Driver Mobile App | Expo (React Native) | Drivers |

This extension adds **two web-based platforms**:

| New Platform | Technology | Users Served | Port |
|---|---|---|---|
| **Customer Website** | Next.js | Customers (web) | 3004 |
| **Driver Website** | Next.js | Drivers (web) | 3003 |

### 1.2 Why Add Web Platforms?

1. **Customer Website** — SEO-indexed public landing page converts anonymous traffic into bookings. No app install barrier. Desktop-first checkout experience.
2. **Driver Website** — Operational fallback for drivers who cannot install the mobile app or are on low-end devices. Full trip management from any browser.
3. **Expo mobile apps remain untouched** — They will later be published as native Android/iOS apps. Web platforms are separate codebases.

### 1.3 How They Integrate with the Backend

Both web apps connect to the **same existing NestJS backend** at `NEXT_PUBLIC_API_URL`. No new backend modules are required. All features reuse existing REST endpoints.

```
[Customer Website] ──►
[Driver Website]   ──►  NestJS Backend (existing) ──► MySQL (Prisma)
[Admin Panel]      ──►
[Facility Portal]  ──►
```

---

## 2. ARCHITECTURE DESIGN

### 2.1 Tech Stack Decision

| Concern | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 16.1.6** | Matches admin/facility stack exactly — same build tooling, same patterns |
| Language | **TypeScript 5** | Type safety, reuse of existing type definitions |
| Styling | **Tailwind CSS 4** | Same version as admin panel — visual consistency |
| State Management | **Zustand 5** | Same as admin/facility — persist middleware for hydration |
| HTTP Client | **Axios** | Same as all other apps, interceptor-based JWT injection |
| Token Storage | **js-cookie** | Cookie-based (not localStorage) — same as admin panel, SSR-compatible |
| Forms | **react-hook-form + yup** | Same as admin panel |
| Toasts | **react-hot-toast** | Same as admin panel |
| Icons | **lucide-react** | Same as admin panel |
| Charts (customer) | **recharts** | Same as admin panel (for order tracking progress) |

### 2.2 Folder Structures

#### vastra-express-driver-web
```
vastra-express-driver-web/
├── .env.local.example
├── middleware.ts                   # JWT cookie route protection
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── next-env.d.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx                  # Root layout + Toaster
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx            # OTP login flow (2 steps)
│   └── (dashboard)/
│       ├── layout.tsx              # Auth guard + Sidebar layout
│       ├── page.tsx                # Dashboard – KPIs + quick task list
│       ├── pickups/
│       │   ├── page.tsx            # Pickup list (filter: Active/Completed/All)
│       │   └── [id]/
│       │       └── page.tsx        # Pickup detail + step flow
│       ├── deliveries/
│       │   ├── page.tsx            # Delivery list
│       │   └── [id]/
│       │       └── page.tsx        # Delivery detail + step flow
│       └── profile/
│           └── page.tsx            # Driver profile
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Loading.tsx
├── lib/
│   ├── api.ts                      # Axios + cookie JWT
│   └── utils.ts                    # cn, formatDate, statusLabel, etc.
├── store/
│   ├── authStore.ts                # OTP flow + persist
│   └── deliveryStore.ts            # Pickup/Delivery task state
└── types/
    └── index.ts
```

#### vastra-express-customer-web
```
vastra-express-customer-web/
├── .env.local.example
├── middleware.ts                   # Cookie route protection for /portal/*
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── next-env.d.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx                  # Root layout (SEO meta, Toaster)
│   ├── page.tsx                    # Public landing page
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx            # OTP login
│   └── (portal)/
│       ├── layout.tsx              # Auth guard + PortalNav
│       ├── dashboard/
│       │   └── page.tsx
│       ├── orders/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── book/
│       │   └── page.tsx            # 3-step booking wizard
│       ├── addresses/
│       │   └── page.tsx
│       └── profile/
│           └── page.tsx
├── components/
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Services.tsx
│   │   ├── Pricing.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── WhyUs.tsx
│   │   └── Footer.tsx
│   ├── layout/
│   │   ├── Navbar.tsx              # Public landing navbar
│   │   └── PortalNav.tsx           # Authenticated portal top-nav
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Loading.tsx
├── lib/
│   ├── api.ts
│   └── utils.ts
├── store/
│   └── authStore.ts
└── types/
    └── index.ts
```

### 2.3 Routing Strategy

Both apps use **Next.js App Router** with **route groups**:

| Route Group | Purpose | Auth Required |
|---|---|---|
| `(auth)` | Login/OTP pages | ❌ Public |
| `(dashboard)` (driver) | All driver operations | ✅ DRIVER role |
| `(portal)` (customer) | Customer portal | ✅ CUSTOMER role |
| Root `/` (customer) | Landing page | ❌ Public |

**Route Protection — Two layers:**
1. `middleware.ts` — checks cookie at the edge, redirects `/login` if missing
2. `layout.tsx` — checks Zustand hydration + token validity on client, syncs state

### 2.4 Role-Based Authentication

| App | Allowed Roles | Gate |
|---|---|---|
| Driver Web | `DRIVER` | `verifyOtp` checks `user.role !== 'DRIVER'` and throws |
| Customer Web | `CUSTOMER` | `verifyOtp` checks `user.role !== 'CUSTOMER'` and throws |

Admin and Facility Staff cannot log in to either web app — backend role check plus frontend guard.

### 2.5 Token Storage Strategy

```
Cookie: ve_driver_token   (driver web)   — expires 7 days, SameSite=Strict, Secure in prod
Cookie: ve_customer_token (customer web) — expires 7 days, SameSite=Strict, Secure in prod
```

**Why cookies over localStorage?**
- Readable by Next.js middleware at the edge (no JS required)
- SSR-safe
- Consistent with the admin panel (`ve_admin_token`)

**Zustand persist** backs the user object in localStorage (non-sensitive). Token validity is always confirmed against the cookie.

### 2.6 Reusable UI System Strategy

Each web app has its own `components/ui/` folder (copy-adjusted from admin panel) to:
- Stay independently deployable
- Avoid tight coupling between apps
- Allow per-app customisation (brand colours differ slightly)

**Brand tokens:**
- Driver Web: Primary `violet-700` (operational/serious tone)
- Customer Web: Primary `blue-600` (matches landing brand), `orange-500` for CTAs

---

## 3. FEATURE MAPPING TABLE

### 3.1 Customer Website ↔ Backend APIs

| Feature | Backend Endpoint | Method | Notes |
|---|---|---|---|
| Send OTP | `/auth/send-otp` | POST | `{ mobileNumber }` |
| Verify OTP | `/auth/verify-otp` | POST | `{ mobileNumber, otp }` |
| Get Profile | `/auth/profile` | GET | Auth required |
| Update Profile | `/users/:id` | PATCH | Auth required |
| List Addresses | `/addresses` | GET | Auth required |
| Add Address | `/addresses` | POST | Auth required |
| Update Address | `/addresses/:id` | PATCH | Auth required |
| Delete Address | `/addresses/:id` | DELETE | Auth required |
| Get Cities | `/addresses/cities` | GET | Public |
| Get Available Slots | `/pickup-slots/available` | GET | Auth required |
| Create Order | `/orders` | POST | Auth required |
| List My Orders | `/orders` | GET | Auth, filtered by user |
| Get Order Detail | `/orders/:id` | GET | Auth required |
| Get Order History | `/orders/:id/history` | GET | Auth required |
| Cancel Order | `/orders/:id/cancel` | POST | Auth required |
| Create Payment | `/payments/create-order` | POST | Auth required |
| COD Payment | `/payments/cod` | POST | Auth required |
| Get Pricing | `/billing/pricing` | GET | Public or Auth |
| List Subscriptions | `/subscriptions/plans` | GET | Public |

### 3.2 Driver Website ↔ Backend APIs

| Feature | Backend Endpoint | Method | Notes |
|---|---|---|---|
| Send OTP | `/auth/send-otp` | POST | `{ mobileNumber }` |
| Verify OTP | `/auth/verify-otp` | POST | `{ mobileNumber, otp }` |
| Get Profile | `/auth/profile` | GET | Auth required |
| Get My Assignments | `/delivery/my-assignments` | GET | `?type=PICKUP\|DELIVERY` |
| Update Assignment Status | `/delivery/:id/status` | PATCH | `{ status, notes? }` |
| Update Order Weight | `/orders/:id/weight` | PATCH | Pickup only |

**No new backend modules are needed.** All features map cleanly to existing endpoints.

---

## 4. UI/UX PHILOSOPHY

### 4.1 Customer Website

Inspired by **Urban Company**'s service-first approach:

- **Public Landing Page** — marketing page that converts visitors, not a logged-in app shell
- **Above-the-fold CTA** — "Book Pickup" prominent, city selector future-ready
- **Service cards** — Visual icons, concise descriptions, starting prices
- **Trust signals** — Hygiene certifications, on-time promise, transparent pricing
- **Progressive disclosure** — Public pages show pricing & services; portal unlocks booking
- **3-step booking wizard** — Minimal friction: Address → Schedule → Service
- **Order tracking** — Visual progress bar with 7-step laundry pipeline
- **Mobile-responsive** — Fully responsive for mobile browser users

**Color palette:**
- Primary: `#2563EB` (blue-600)
- Accent/CTA: `#F97316` (orange-500)
- Background: `#F9FAFB` (gray-50)
- Text: `#111827` (gray-900)

### 4.2 Driver Website

Inspired by **operational dashboards** (delivery/fleet management tools):

- **Sidebar layout** — Quick access to all sections; matches admin panel feel
- **Task-first design** — Dashboard surfaces active tasks immediately
- **Status step flow** — Large, clear action buttons; one action at a time
- **Weight modal** — Focused input for laundry weight entry at pickup completion
- **Color-coded status** — Instant visual differentiation between ASSIGNED / IN_PROGRESS / COMPLETED
- **Minimal distractions** — No charts, no analytics; pure task execution UI

**Color palette:**
- Primary: `#6D28D9` (violet-700)
- Success: `#059669` (emerald-600)
- Warning: `#D97706` (amber-600)
- Background: `#F5F3FF` (violet-50)

---

## 5. DEPLOYMENT STRATEGY

### 5.1 Project Structure Decision: **Separate Next.js Projects**

Each app is an independent Next.js project (not a monorepo). Rationale:

| Criterion | Separate Projects ✅ | Monorepo |
|---|---|---|
| Independent deployments | ✅ | Requires tooling (Turborepo/Nx) |
| Consistent with existing admin/facility | ✅ | Admin/facility are already separate |
| Team independence | ✅ | Shared configs can cause conflicts |
| Complexity | Low ✅ | High |

### 5.2 Shared Component Library

Not a formal shared package at this stage. UI components are **copied and lightly customised** in each app. A shared library (`@vastra/ui`) can be extracted in Phase 2.

### 5.3 VPS Hosting Plan

**Recommended: Single VPS with Nginx reverse proxy**

```
Nginx (port 80/443)
 ├── admin.vastraexpress.com     → localhost:3001  (admin panel)
 ├── facility.vastraexpress.com  → localhost:3002  (facility portal)
 ├── driver.vastraexpress.com    → localhost:3003  (driver web)
 ├── www.vastraexpress.com       → localhost:3004  (customer web)
 └── api.vastraexpress.com       → localhost:3000  (NestJS backend)
```

**Process management:** PM2 ecosystem config
```bash
pm2 start npm --name "admin"    -- start --prefix vastra-express-admin
pm2 start npm --name "facility" -- start --prefix vastra-express-facility
pm2 start npm --name "driver-web"   -- start --prefix vastra-express-driver-web
pm2 start npm --name "customer-web" -- start --prefix vastra-express-customer-web
pm2 start npm --name "backend"  -- start --prefix vastra-express-backend
```

### 5.4 Environment Variables

Each project requires a `.env.local`:

**vastra-express-driver-web/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**vastra-express-customer-web/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 5.5 Build & Run

```bash
# Driver Web
cd vastra-express-driver-web
npm install
npm run dev     # dev: port 3003
npm run build   # production build
npm run start   # production: port 3003

# Customer Web
cd vastra-express-customer-web
npm install
npm run dev     # dev: port 3004
npm run build   # production build
npm run start   # production: port 3004
```

---

## 6. CONSTRAINTS & GUARDRAILS

| Constraint | Detail |
|---|---|
| No backend schema changes | Existing Prisma schema is frozen |
| No order state machine modifications | State transitions remain backend-enforced |
| No existing app modifications | Admin, Facility, Customer Mobile, Driver Mobile unchanged |
| DTO reuse | All request/response shapes match existing backend DTOs |
| Role isolation | Driver web blocks non-DRIVER accounts; Customer web blocks non-CUSTOMER |
| Cookie-based auth | Middleware-compatible; no localStorage-only token |
| TypeScript strict mode | All new code must pass strict TypeScript |

---

## 7. FUTURE NOTES (Not in Scope)

- Item-level pricing UI (pending client item list) 
- Push notifications for web (Web Push API)
- Real-time order tracking via WebSockets
- Shared `@vastra/ui` component library extraction
- Customer loyalty/reward points UI
- Driver earnings & payout dashboard
- Monorepo migration (Turborepo)

---

*This document supersedes all earlier architectural notes regarding web platform extension.*
