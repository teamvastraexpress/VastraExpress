# PROJECT PROGRESS — Vastra Express
**Last Updated:** March 4, 2026  
**Overall:** ~85% complete — 6 of 8 phases done, 2 remaining (Android + Production)

---

## ✅ PHASE 1 — Backend Core
**Stack:** NestJS + Prisma + MySQL · Port 3000

All 16 modules complete:
Auth, Users, Addresses, Pickup Slots, Orders, Billing, Subscriptions, Payments, Delivery, Inventory, Notifications (mock), Reports, Facilities, Cities, Staff, Swagger Docs

Key features done:
- Full order state machine (22 statuses)
- JWT + RBAC (4 roles)
- Admin pre-seeded on boot
- Staff 3-state login flow (mobile → OTP/password)
- Razorpay integration (test mode)
- Firebase + MSG91 (mock — no credentials yet)
- Slot auto-generator cron (daily, IST-safe)
- Hybrid billing: weight-based + item-based + GST

---

## ✅ PHASE 2 — Admin Panel
**Stack:** Next.js · Port 3001

All pages complete: Login, Dashboard, Orders, Users & Staff, Subscriptions, Billing/Pricing, Inventory, Reports, Settings (Facilities + Cities), Delivery, Payments

---

## ✅ PHASE 3 — Facility Portal
**Stack:** Next.js · Port 3002

All pages complete: 3-state login, Dashboard, Orders Processing, Pickup Slots, Driver Assignment, Inventory, Reports

---

## ✅ PHASE 4 — Driver Mobile App
**Stack:** Expo + React Native + NativeWind · Port 3003 (web preview)

All screens complete: OTP Login, Home Dashboard, Pickups list, Deliveries list, Task Detail (3-step flow + weight entry), Profile

---

## ✅ PHASE 5 — Customer Mobile App
**Stack:** Expo + React Native + NativeWind · Port 3004 (web preview)

All screens complete: OTP Login, Home, Orders list, Order Detail + Tracking, Order Creation (3-step wizard), Addresses, Subscription (built, UI hidden), Profile

---

## ✅ PHASE 6 — Customer & Driver Web (Next.js)
**Reference:** WEBSITE_EXTENSION_PLAN.md

### Customer Web (`vastra-express-customer-web`) · Port 3004
- Public landing page (Hero, Services, Pricing, How It Works, Why Us, Footer)
- OTP login, portal dashboard, order list, order detail + tracking
- 3-step booking wizard (address → slot → service)
- Address management, profile

### Driver Web (`vastra-express-driver-web`) · Port 3003
- OTP login, dashboard (KPIs + tasks)
- Pickups list + detail (3-step flow)
- Deliveries list + detail
- Profile

---

## ⏳ PHASE 7 — Android APK Conversion
**Status:** Not started

- [ ] Firebase project setup (google-services.json for both apps)
- [ ] EAS Build configure (`eas login`, `eas build:configure`)
- [ ] Push notifications (expo-notifications)
- [ ] Native Razorpay SDK (customer app Android)
- [ ] Preview APK build (driver + customer)
- [ ] Physical device testing
- [ ] Production AAB build (Google Play)

---

## ⏳ PHASE 8 — Production Hardening
**Status:** Not started

- [ ] Backend: Helmet, rate limiting, CORS whitelist, Winston logging
- [ ] Hostinger VPS setup (Ubuntu 22.04, Node, MySQL, Nginx, PM2, SSL)
- [ ] Deploy backend + all 4 web panels
- [ ] DB backup cron + PM2 log rotation
- [ ] Full production checklist

---

## 🔑 Pending External Credentials

| Service | Status | Blocks |
|---|---|---|
| MSG91 Auth Key + Template ID | ❌ Not set | Live OTP SMS |
| Firebase Service Account JSON | ❌ Not set | Push notifications |
| Razorpay Production Keys | ❌ Not set | Live payments |
| VPS / Domain / DNS | ❌ Not set | Phase 8 deployment |

---

## 🖥️ Dev Servers

| App | URL | Command |
|---|---|---|
| Backend API | http://localhost:3000/api | `npm run start:dev` |
| Swagger Docs | http://localhost:3000/api/docs | — |
| Admin Panel | http://localhost:3001 | `npm run dev` |
| Facility Portal | http://localhost:3002 | `npm run dev` |
| Driver Web (Next.js) | http://localhost:3003 | `npm run dev` |
| Customer Web (Next.js) | http://localhost:3004 | `npm run dev` |
| Driver App (Expo) | http://localhost:3003 | `npm run web` |
| Customer App (Expo) | http://localhost:3004 | `npm run web` |