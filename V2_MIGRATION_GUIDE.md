# VASTRA EXPRESS — VERSION 2 MIGRATION GUIDE
## Billing & Payment System Removal

**Version:** 2.0 → 2.1 (Post-Billing Removal)
**Created:** March 12, 2026
**Scope:** Backend · Admin Panel · Facility Portal · Customer App · Customer Web

---

## 📋 TABLE OF CONTENTS

1. [Summary of Changes](#1-summary-of-changes)
2. [Impact Map — Every Affected File](#2-impact-map--every-affected-file)
3. [New Order Lifecycle (V2)](#3-new-order-lifecycle-v2)
4. [Phase A — Backend Changes](#phase-a--backend-changes)
5. [Phase B — Database Schema Changes](#phase-b--database-schema-changes)
6. [Phase C — Admin Panel Changes](#phase-c--admin-panel-changes)
7. [Phase D — Facility Portal Changes](#phase-d--facility-portal-changes)
8. [Phase E — Customer App Changes](#phase-e--customer-app-changes)
9. [Phase F — Customer Web Changes](#phase-f--customer-web-changes)
10. [Phase G — Subscription System Decision](#phase-g--subscription-system-decision)
11. [Phase H — Dependency Cleanup](#phase-h--dependency-cleanup)
12. [Testing Checklist](#testing-checklist)

---

## 1. SUMMARY OF CHANGES

### What Is Being Removed

| System | What Goes Away |
|--------|---------------|
| **Razorpay** | Entire payment gateway integration — `RazorpayService`, order creation, payment verification, webhook handler |
| **Billing Module** | Bill generation by facility, bill preview, GST invoice, itemized pricing calculations |
| **Payments Module** | Payment method selection (UPI/Card/COD/Wallet), payment status tracking, Razorpay webhook |
| **Refunds** | Refund initiation, processing, and `REFUND_INITIATED` order status |
| **BILL_GENERATED Status** | This order status step is removed from the lifecycle |
| **Payment Notifications** | FCM/SMS triggers for `BILL_GENERATED` and `REFUND_INITIATED` events |
| **Admin Billing Page** | `/billing` route and UI in admin panel |
| **Admin Payments Page** | `/payments` route and UI in admin panel |
| **Facility Bill Generation** | "Generate Bill" action, bill preview, pricing config in facility portal |
| **Customer Bill/Invoice UI** | Bill display, payment method selector, invoice view in customer app & web |
| **Customer Wallet Screen** | Wallet balance, wallet transaction history (wallet was billing-linked) |
| **Pricing Configuration** | Per-kg / per-item pricing config (only existed to calculate bills) |
| **Order Items (Itemized)** | `OrderItem` records created during itemized billing |

### What Is Kept

| System | Why Kept |
|--------|---------|
| **SMS OTP (MSG91)** | Still required for Customer & Driver authentication |
| **FCM Push Notifications** | Still used for order status updates (pickup, delivery, etc.) — only payment-related triggers removed |
| **Order Weight Tracking** | `initialWeight` / `finalWeight` on orders — kept for operational records, even without billing |
| **Subscriptions (partial)** | See [Phase G](#phase-g--subscription-system-decision) for full decision |
| **All other modules** | Auth, Orders, Delivery, Inventory, Facilities, Reports, Users — unchanged |

### Additional Changes That Follow From This Removal

| Change | Reason |
|--------|--------|
| Order status `PACKING → READY_FOR_DISPATCH` becomes direct | No more `BILL_GENERATED` step between them |
| Facility staff cannot advance an order beyond `PACKING` manually to billing | This action disappears from the UI entirely |
| `Payment` and `Refund` DB tables are dropped | No payment records to store |
| `PricingConfiguration` DB table is dropped | Was only used to compute bill amounts |
| `OrderItem` DB table is dropped | Was only populated during itemized billing |
| Admin reports that referenced payments/revenue will need to be updated | Payment revenue reports become irrelevant |

---

## 2. IMPACT MAP — EVERY AFFECTED FILE

### Backend (`vastra-express-backend`)

#### Files to DELETE entirely
```
src/billing/                         ← entire folder
  billing.controller.ts
  billing.module.ts
  billing.service.ts
  pricing.service.ts
  pricing.service.spec.ts
  dto/billing.dto.ts

src/payments/                        ← entire folder
  payments.controller.ts
  payments.module.ts
  payments.service.ts
  razorpay.service.ts
  dto/payment.dto.ts
```

#### Files to MODIFY
```
src/app.module.ts                    ← Remove BillingModule, PaymentsModule imports
src/orders/enums/order-status.enum.ts ← Remove BILL_GENERATED, REFUND_INITIATED
src/orders/orders.service.ts         ← Remove billing-related status transitions & checks
src/orders/orders.controller.ts      ← Remove payment method selection endpoint
src/notifications/notifications.service.ts  ← Remove BILL_GENERATED & REFUND_INITIATED triggers
src/notifications/sms.service.ts     ← Remove BILL_GENERATED SMS template
src/subscriptions/subscriptions.service.ts  ← Remove Razorpay subscription purchase (see Phase G)
prisma/schema.prisma                 ← Remove Payment, Refund, PricingConfiguration, OrderItem models
```

### Admin Panel (`vastra-express-admin`)

#### Files to DELETE entirely
```
app/(dashboard)/billing/page.tsx     ← entire billing page
app/(dashboard)/payments/page.tsx    ← entire payments page
```

#### Files to MODIFY
```
app/(dashboard)/layout.tsx           ← Remove Billing and Payments from sidebar nav
components/layout/Sidebar.tsx        ← (if nav links are here) Remove billing & payments links
app/(dashboard)/reports/page.tsx     ← Remove payment/revenue report sections
app/(dashboard)/orders/page.tsx      ← Remove payment status column (if present)
app/(dashboard)/subscriptions/page.tsx ← Remove subscription purchase via Razorpay
lib/api.ts                           ← Remove billing and payment API call functions
types/index.ts                       ← Remove Payment, Refund, PricingConfiguration types
```

### Facility Portal (`vastra-express-facility`)

#### Files to MODIFY
```
app/(dashboard)/orders/              ← Remove "Generate Bill" button, bill preview UI
                                        Advance order directly PACKING → READY_FOR_DISPATCH
app/(dashboard)/page.tsx             ← Remove any billing/revenue stats from dashboard
lib/api.ts                           ← Remove billing API call functions
types/index.ts                       ← Remove billing-related types
```

#### Files to NOT CHANGE (confirming scope)
```
app/(dashboard)/inventory/           ← No billing references — untouched
app/(dashboard)/delivery/            ← No billing references — untouched
app/(dashboard)/slots/               ← No billing references — untouched
app/(dashboard)/reports/             ← Keep but remove revenue/billing sections
```

### Customer App (`vastra-express-customer`)

#### Files to DELETE entirely
```
app/(tabs)/wallet.tsx                ← Wallet screen (entire tab)
```

#### Files to MODIFY
```
app/(tabs)/_layout.tsx               ← Remove wallet tab from bottom navigation
app/order/[id].tsx                   ← Remove payment section, bill display,
                                        payment method selector, invoice button
app/subscription/index.tsx           ← Remove wallet balance display,
                                        subscription purchase via Razorpay (see Phase G)
store/orderStore.ts                  ← Remove selectPaymentMethod, paymentLoading,
                                        paymentError, payment-related state & actions
store/subscriptionStore.ts           ← Remove walletHistory, fetchWalletHistory
                                        (if subscriptions are kept, remove wallet parts)
lib/api.ts                           ← Remove payment & billing API functions
types/index.ts                       ← Remove Payment, Invoice types
constants/index.ts                   ← Remove BILL_GENERATED, REFUND_INITIATED
                                        from tracking steps array
```

### Customer Web (`vastra-express-customer-web`)

#### Files to MODIFY
```
app/(portal)/orders/                 ← Remove bill display, payment section
lib/api.ts                           ← Remove payment & billing API functions
store/                               ← Remove payment-related state
types/index.ts                       ← Remove Payment, Invoice types
```

### Driver App & Driver Web (`vastra-express-driver`, `vastra-express-driver-web`)

> **No changes needed.** Driver portals never had billing or payment UI. Drivers only handle pickup/delivery status updates. These are unaffected.

---

## 3. NEW ORDER LIFECYCLE (V2)

### V1 Lifecycle (Current)
```
ORDER_CREATED → ORDER_CONFIRMED → PICKUP_SCHEDULED → PICKUP_ASSIGNED →
OUT_FOR_PICKUP → PICKUP_ARRIVED → PICKED_UP → RECEIVED_AT_FACILITY →
SORTING → WASHING → IRONING → PACKING →
[BILL_GENERATED]               ← ❌ REMOVED
→ READY_FOR_DISPATCH → DELIVERY_ASSIGNED → OUT_FOR_DELIVERY →
DELIVERY_ARRIVED → DELIVERED
```

### V2 Lifecycle (New)
```
ORDER_CREATED → ORDER_CONFIRMED → PICKUP_SCHEDULED → PICKUP_ASSIGNED →
OUT_FOR_PICKUP → PICKUP_ARRIVED → PICKED_UP → RECEIVED_AT_FACILITY →
SORTING → WASHING → IRONING → PACKING →
READY_FOR_DISPATCH → DELIVERY_ASSIGNED → OUT_FOR_DELIVERY →
DELIVERY_ARRIVED → DELIVERED
```

### V2 Exception States (Removed states crossed out)
```
CANCELLED          ← kept
PICKUP_FAILED      ← kept
PROCESSING_ISSUE   ← kept
DELIVERY_FAILED    ← kept
REFUND_INITIATED   ← ❌ REMOVED (no payments = no refunds)
```

### Transition Rule Change
The facility portal currently transitions:
- `PACKING` → **[generate bill]** → `BILL_GENERATED` → `READY_FOR_DISPATCH`

In V2, this becomes:
- `PACKING` → **[mark ready]** → `READY_FOR_DISPATCH`

The "Generate Bill & Confirm" button in the facility portal is **replaced** with a simple "Mark as Ready for Dispatch" button.

---

## PHASE A — BACKEND CHANGES

### A1. Remove Billing Module

**Step 1:** Delete the entire `src/billing/` folder.

**Step 2:** In `src/app.module.ts`, remove:
- `import { BillingModule } from './billing/billing.module';`
- `BillingModule` from the `imports` array

### A2. Remove Payments Module

**Step 1:** Delete the entire `src/payments/` folder.

**Step 2:** In `src/app.module.ts`, remove:
- `import { PaymentsModule } from './payments/payments.module';`
- `PaymentsModule` from the `imports` array

### A3. Update Order Status Enum

**File:** `src/orders/enums/order-status.enum.ts`

Remove these two enum values:
```typescript
BILL_GENERATED = 'BILL_GENERATED',    // ← DELETE
REFUND_INITIATED = 'REFUND_INITIATED', // ← DELETE
```

### A4. Update Orders Service & Controller

**File:** `src/orders/orders.service.ts`

Search for and remove or update:
- Any status transition that goes TO or FROM `BILL_GENERATED`
- Any check like `if status === BILL_GENERATED` or transition rules involving it
- Any call to `BillingService` or `PaymentsService` (these were injected via module imports)
- The status transition `PACKING → BILL_GENERATED` becomes `PACKING → READY_FOR_DISPATCH`

> **Important:** The `VALID_TRANSITIONS` map (or equivalent state-machine logic) in `orders.service.ts` must be updated. Specifically:
> - Remove entry: `PACKING: [BILL_GENERATED]`
> - Add/update entry: `PACKING: [READY_FOR_DISPATCH]`
> - Remove entry: `BILL_GENERATED: [READY_FOR_DISPATCH]`

**File:** `src/orders/orders.controller.ts`

- Remove the `POST /orders/:id/select-payment-method` endpoint (if present here)
- Remove any endpoint that triggers billing (these were in BillingController, so likely no duplicates)

### A5. Update Notifications Service

**File:** `src/notifications/notifications.service.ts`

In the `notifyOrderStatus()` method, remove these two entries from the `statusLabels` map:
```typescript
BILL_GENERATED: 'Your bill is ready — please complete payment 💳', // ← DELETE
REFUND_INITIATED: 'Refund has been initiated',                       // ← DELETE
```

**File:** `src/notifications/sms.service.ts`

In the constructor's `defaultTemplateIds` object, remove:
```typescript
BILL_GENERATED: this.configService.get('MSG91_TEMPLATE_BILL', ''), // ← DELETE
```

In any `notifyOrderStatus` SMS-sending logic (check `sms.service.ts` lines ~100+), remove:
- The `BILL_GENERATED` case from the critical-statuses list that triggers SMS

### A6. Update Subscriptions Service (if keeping subscriptions)

**File:** `src/subscriptions/subscriptions.service.ts`

- Remove the `purchaseSubscription()` method (it uses Razorpay to charge for plan purchase)
- Remove the `RefundWalletDto` and associated refund-wallet logic
- Remove wallet deduction logic (`deductFromWallet`) since wallet was deducted during bill generation
- Keep: `getPlans()`, `getMySubscription()`, plan CRUD for admin, subscription status checks

> See [Phase G](#phase-g--subscription-system-decision) for the full subscription decision.

### A7. Clean Up `.env`

Remove these environment variables from `.env` and `.env.example`:
```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
FIREBASE_SERVICE_ACCOUNT=          # Only if removing FCM entirely (see Phase G)
MSG91_TEMPLATE_BILL=
MSG91_AUTH_KEY=                     # Keep this — still used for OTP auth
MSG91_TEMPLATE_ID=                  # Keep OTP template
```

> **Note:** `FIREBASE_SERVICE_ACCOUNT` should only be removed if you decide to drop FCM push notifications entirely. If you keep order status push notifications (recommended for good UX), keep this env var.

---

## PHASE B — DATABASE SCHEMA CHANGES

### B1. Models to Remove from `prisma/schema.prisma`

Delete the following complete model blocks:

#### Remove: `Payment` model
```prisma
model Payment { ... }   // ← DELETE entire block (~20 lines)
```

#### Remove: `Refund` model
```prisma
model Refund { ... }    // ← DELETE entire block (~15 lines)
```

#### Remove: `PricingConfiguration` model
```prisma
model PricingConfiguration { ... }  // ← DELETE entire block (~20 lines)
```

#### Remove: `OrderItem` model
```prisma
model OrderItem { ... }  // ← DELETE entire block (~15 lines)
```

### B2. Update `Order` Model

Remove these relations from the `Order` model:
```prisma
orderItems          OrderItem[]         // ← DELETE (model gone)
payments            Payment[]           // ← DELETE (model gone)
refunds             Refund[]            // ← DELETE (model gone)
walletTransactions  WalletTransaction[] // ← DELETE (wallet deduction was billing-linked)
```

Keep these fields (weight tracking is still operationally useful):
```prisma
initialWeight  Decimal?   // ← KEEP — driver records weight at pickup
finalWeight    Decimal?   // ← KEEP — facility records final weight for records
```

### B3. Update `WalletTransaction` Model (if keeping subscriptions)

If subscriptions are kept but billing is removed, the `WalletTransaction` model loses its reason to exist (wallet was only debited during billing). Two options:

- **Option A (Recommended):** Remove `WalletTransaction` model entirely, remove `walletBalance` from `Subscription` model
- **Option B:** Keep as an audit log for future use (harmless but adds DB noise)

### B4. Run Migration

After all schema changes:
```bash
npx prisma migrate dev --name remove_billing_payments
npx prisma generate
```

> **Warning:** This migration will DROP the `payments`, `refunds`, `pricing_configurations`, and `order_items` tables. Back up data before running in any non-fresh environment.

### B5. Update Prisma Client Usages

After removing models, any service that calls `prisma.payment.*`, `prisma.refund.*`, `prisma.pricingConfiguration.*`, or `prisma.orderItem.*` will cause TypeScript compile errors. These are caught during `npm run build` — fix them as they appear, primarily in:
- `src/billing/` (deleted — no action needed)
- `src/payments/` (deleted — no action needed)
- `src/subscriptions/subscriptions.service.ts` — check for `prisma.walletTransaction` calls
- `src/orders/orders.service.ts` — check for any `orderItems` include in order queries
- `src/reports/reports.service.ts` — check for payment/revenue queries

---

## PHASE C — ADMIN PANEL CHANGES

### C1. Delete Billing & Payments Pages
```
Delete: app/(dashboard)/billing/page.tsx
Delete: app/(dashboard)/payments/page.tsx
```

### C2. Remove from Navigation Sidebar

**File:** `app/(dashboard)/layout.tsx` (and/or `components/layout/Sidebar.tsx`)

Remove these nav items:
- `{ href: '/billing', label: 'Billing', icon: ... }`
- `{ href: '/payments', label: 'Payments', icon: ... }`

### C3. Update API Types

**File:** `types/index.ts`

Remove these interfaces/types:
- `Payment` / `PaymentRecord` (any type describing a payment)
- `Refund`
- `PricingConfiguration`
- `Invoice`
- `BillPreview`
- `OrderItem` (if defined here for billing)

### C4. Update API Client

**File:** `lib/api.ts`

Remove these API function groups:
- All functions calling `/billing/*` endpoints
- All functions calling `/payments/*` endpoints

### C5. Update Reports Page

**File:** `app/(dashboard)/reports/page.tsx`

Remove:
- Revenue charts / payment totals
- Collection status breakdowns
- Any section labelled "Payments", "Revenue", "Outstanding Bills"

Keep:
- Order volume reports
- Facility performance reports
- Driver performance reports

### C6. Update Orders Page

**File:** `app/(dashboard)/orders/page.tsx`

- Remove `Payment Status` column from the orders table (if present)
- Remove any filter by payment status

### C7. Update Subscriptions Page

**File:** `app/(dashboard)/subscriptions/page.tsx`

- Remove "Assign to order / wallet deduct" actions
- Remove wallet balance editing (if present)
- Keep: plan management, subscription listing, activation/deactivation

---

## PHASE D — FACILITY PORTAL CHANGES

### D1. Update Order Detail / Processing View

**File:** `app/(dashboard)/orders/` (check `[id]/page.tsx` or similar)

**Remove:**
- "Generate Bill" button
- "Preview Bill" button
- Bill amount display / pricing summary
- Any `useItemBilling` toggle
- The BILL_GENERATED step in the order progress tracker

**Replace With:**
- After completing PACKING status, show a **"Mark as Ready for Dispatch"** button
- This directly transitions the order from `PACKING` → `READY_FOR_DISPATCH`
- API call: `PATCH /orders/:id/status` with `{ status: 'READY_FOR_DISPATCH' }`

### D2. Update Orders List / Dashboard

**File:** `app/(dashboard)/page.tsx`

- Remove any revenue or billing KPI cards (e.g., "Pending Bills", "Revenue Today")
- Keep: pending orders count, in-processing orders count, dispatch ready count

### D3. Remove Pricing Configuration

If the facility portal had a pricing configuration management page (prices per kg / per item), **delete it entirely**. Pricing config only existed to power the bill calculator.

### D4. Update Status Tracker UI Component

The order status progress stepper shown in the facility portal likely includes `BILL_GENERATED`. Remove this step from the visual tracker. The processing sequence displayed should be:

```
Received → Sorting → Washing → Ironing → Packing → Ready for Dispatch
```

### D5. Update API Client

**File:** `lib/api.ts`

Remove:
- `generateBill(orderId, dto)`
- `previewBill(orderId)`
- `getInvoice(orderId)`
- `getPricingConfig()`
- `updatePricingConfig(dto)`

---

## PHASE E — CUSTOMER APP CHANGES

### E1. Remove Wallet Tab

**Delete:** `app/(tabs)/wallet.tsx`

**File:** `app/(tabs)/_layout.tsx`

Remove the wallet tab entry from the `<Tabs>` configuration:
```tsx
// DELETE this tab:
<Tabs.Screen name="wallet" options={{ title: 'Wallet', tabBarIcon: ... }} />
```

### E2. Update Order Detail Screen

**File:** `app/order/[id].tsx`

**Remove these sections/components entirely:**
- Payment method selector (the section asking customer to choose UPI / Card / COD / Wallet)
- Bill summary card (showing amount breakdown — service charges, GST, express charge, wallet discount)
- "View Invoice" / "Download Invoice" button
- `paymentLoading`, `paymentError`, `paymentDone` state variables
- `handleSelectPayment()` function
- The `BILL_GENERATED` conditional render block (e.g., `if (order.status === 'BILL_GENERATED') { ... }`)

**Keep:**
- Order tracking progress stepper (without BILL_GENERATED step)
- Order status history timeline
- Cancel order button
- Weight information display (if shown)

**Update tracking steps constant** to remove BILL_GENERATED:
- Check `constants/index.ts` for `TRACKING_STEPS` array
- Remove the `BILL_GENERATED` entry

### E3. Update Order Store

**File:** `store/orderStore.ts`

Remove:
- `selectPaymentMethod` action
- `paymentLoading` state
- `paymentError` state
- Any reference to `PaymentMethod` type
- Any action that calls `/payments/*` or `/billing/*` API endpoints

### E4. Update Subscription Store

**File:** `store/subscriptionStore.ts`

Remove:
- `walletHistory` state
- `fetchWalletHistory` action
- Any action calling `/subscriptions/wallet-history` or similar

### E5. Update Subscription Screen

**File:** `app/subscription/index.tsx`

Remove:
- Wallet balance display (was: "Available Balance: ₹500")
- "Buy Subscription" button that triggers Razorpay payment flow
- Any Razorpay SDK imports or payment sheet calls

If subscriptions are fully removed (see Phase G), delete this file entirely.

If subscriptions are simplified (kept without payment), update to show only:
- Current plan name and validity dates
- No purchase flow (subscriptions assigned by admin only, or removed)

### E6. Update API Client

**File:** `lib/api.ts`

Remove functions calling:
- `/billing/*`
- `/payments/*`
- `/subscriptions/purchase` (Razorpay flow)
- `/subscriptions/wallet-history`

### E7. Update Types

**File:** `types/index.ts`

Remove:
- `Payment` type
- `Invoice` type
- `BillPreview` type
- `WalletTransaction` type (or keep if subscriptions retained)
- `BILL_GENERATED` and `REFUND_INITIATED` from `OrderStatus` type union

---

## PHASE F — CUSTOMER WEB CHANGES

The customer web (`vastra-express-customer-web`) mirrors the mobile app's feature set. Apply the same logic:

### F1. Update Order Detail Page

**File:** `app/(portal)/orders/[id]/page.tsx` (or equivalent)

- Remove payment section (same removals as Phase E2)
- Remove bill/invoice display
- Update order status tracker to exclude `BILL_GENERATED`

### F2. Update Navigation / Profile

- Remove wallet link from navigation (if present)
- Remove payment history section from profile

### F3. Update Store & API

- Same pattern as Phase E3–E6 — remove payment/billing actions, API calls, and types

---

## PHASE G — SUBSCRIPTION SYSTEM DECISION

> **This requires a product decision before implementation.**

### Current Subscription Behaviour (V1)
- Customer purchases a subscription plan via **Razorpay**
- Customer receives **wallet credits** (e.g., ₹2000 added to wallet)
- When a bill is generated, wallet balance is **auto-deducted** against the bill amount
- Subscription also provides: free pickup/delivery, usage discounts

### Problem in V2
- With **billing removed**, the wallet has no deduction trigger
- The **Razorpay purchase flow** for subscriptions must be removed (Razorpay is gone)
- Subscription benefits around pricing discounts are meaningless without billing

### Option A — Remove Subscriptions Entirely (Recommended for V2)

**If chosen, additionally:**

Backend:
- Delete `src/subscriptions/` folder
- Remove `SubscriptionsModule` from `app.module.ts`
- Remove `Subscription`, `SubscriptionPlan`, `WalletTransaction` models from Prisma schema
- Remove `subscription_id` FK from `Order` model
- Run migration: `npx prisma migrate dev --name remove_subscriptions`

Admin Panel:
- Delete `app/(dashboard)/subscriptions/page.tsx`
- Remove Subscriptions from sidebar nav

Customer App:
- Delete `app/subscription/index.tsx`
- Remove from navigation
- Delete `store/subscriptionStore.ts`

### Option B — Keep Subscriptions as Admin-Assigned Status Only

Subscriptions become a simple flag: "this customer is a subscriber" (free pickup/delivery benefit).

**If chosen:**
- Remove `walletBalance`, `walletCredit`, `WalletTransaction` model entirely
- Remove subscription purchase endpoint (no Razorpay)
- Admin manually assigns subscriptions to customers
- Customer app shows subscription status (active/expired) only — no wallet

**Backend changes:**
- Remove `purchaseSubscription()` from `SubscriptionsService`
- Remove `walletBalance` field from `Subscription` model
- Remove `walletCredit` from `SubscriptionPlan` model
- Remove `WalletTransaction` model entirely
- Keep: `getPlans()`, `getMySubscription()`, `createPlan()`, basic CRUD

---

## PHASE H — DEPENDENCY CLEANUP

### H1. Backend Package Removal

**File:** `vastra-express-backend/package.json`

Remove these packages (run `npm uninstall` for each):
```bash
npm uninstall razorpay
```

**Keep (still needed):**
```
firebase-admin   ← Keep if retaining FCM order status notifications
axios            ← Keep (used for MSG91 SMS OTP)
```

If you decide to also remove FCM push notifications (making the app notification-free):
```bash
npm uninstall firebase-admin
```

Remove `FIREBASE_SERVICE_ACCOUNT` from `.env` if firebase-admin is removed.

### H2. Customer App Package Removal

**File:** `vastra-express-customer/package.json`

If the Razorpay React Native SDK was installed:
```bash
npm uninstall react-native-razorpay
# or
npm uninstall razorpay
```

Check `package.json` for any payment-related packages and remove them.

---

## TESTING CHECKLIST

After completing all phases, verify the following:

### Backend Compilation
- [ ] `npm run build` completes with 0 errors in `vastra-express-backend`
- [ ] No TypeScript errors referencing `Payment`, `Refund`, `PricingConfiguration`, `OrderItem` Prisma models
- [ ] No references to `BillingModule`, `PaymentsModule`, `RazorpayService` remain
- [ ] `BILL_GENERATED` and `REFUND_INITIATED` are absent from `OrderStatus` enum

### Database Migration
- [ ] `npx prisma migrate dev` runs without error
- [ ] `payments` table is dropped
- [ ] `refunds` table is dropped
- [ ] `pricing_configurations` table is dropped
- [ ] `order_items` table is dropped
- [ ] `order_status_history` contains no `BILL_GENERATED` or `REFUND_INITIATED` rows

### Order State Machine (Backend)
- [ ] An order in `PACKING` status can transition directly to `READY_FOR_DISPATCH`
- [ ] An order in `PACKING` status cannot transition to `BILL_GENERATED` (status rejected with 400)
- [ ] POST `/billing/generate/:id` returns 404 (route no longer exists)
- [ ] POST `/payments/create-order` returns 404 (route no longer exists)

### Facility Portal
- [ ] No "Generate Bill" button visible on any order
- [ ] Order at `PACKING` status shows "Mark as Ready for Dispatch" button
- [ ] Clicking that button transitions order to `READY_FOR_DISPATCH`
- [ ] No billing/pricing navigation link in sidebar
- [ ] Order progress tracker does not show `BILL_GENERATED` step

### Admin Panel
- [ ] No Billing page accessible (direct URL should 404)
- [ ] No Payments page accessible (direct URL should 404)
- [ ] Sidebar has no Billing or Payments links
- [ ] Reports page loads without payment/revenue sections

### Customer App
- [ ] No Wallet tab in bottom navigation
- [ ] Order detail screen has no payment section or bill display
- [ ] Order progress tracker shows no `BILL_GENERATED` step
- [ ] Customer cannot reach any payment flow
- [ ] Order tracking works end-to-end without errors

### Auth / OTP (Regression Check — Must Still Work)
- [ ] Customer can request OTP and login
- [ ] Driver can request OTP and login
- [ ] Facility staff can login with password
- [ ] Admin can login with username + password

### Notifications (Regression Check)
- [ ] Order status push notification fires for `PICKUP_SCHEDULED` (non-payment event)
- [ ] Order status push notification fires for `DELIVERED` (non-payment event)
- [ ] No notification attempts to fire for `BILL_GENERATED`

---

## QUICK REFERENCE — FILES CHANGED SUMMARY

| Action | Path |
|--------|------|
| 🗑️ DELETE | `vastra-express-backend/src/billing/` (entire folder) |
| 🗑️ DELETE | `vastra-express-backend/src/payments/` (entire folder) |
| ✏️ MODIFY | `vastra-express-backend/src/app.module.ts` |
| ✏️ MODIFY | `vastra-express-backend/src/orders/enums/order-status.enum.ts` |
| ✏️ MODIFY | `vastra-express-backend/src/orders/orders.service.ts` |
| ✏️ MODIFY | `vastra-express-backend/src/notifications/notifications.service.ts` |
| ✏️ MODIFY | `vastra-express-backend/src/notifications/sms.service.ts` |
| ✏️ MODIFY | `vastra-express-backend/src/subscriptions/subscriptions.service.ts` |
| ✏️ MODIFY | `vastra-express-backend/prisma/schema.prisma` |
| 🗑️ DELETE | `vastra-express-admin/app/(dashboard)/billing/page.tsx` |
| 🗑️ DELETE | `vastra-express-admin/app/(dashboard)/payments/page.tsx` |
| ✏️ MODIFY | `vastra-express-admin/app/(dashboard)/layout.tsx` |
| ✏️ MODIFY | `vastra-express-admin/app/(dashboard)/reports/page.tsx` |
| ✏️ MODIFY | `vastra-express-admin/app/(dashboard)/orders/page.tsx` |
| ✏️ MODIFY | `vastra-express-admin/lib/api.ts` |
| ✏️ MODIFY | `vastra-express-admin/types/index.ts` |
| ✏️ MODIFY | `vastra-express-facility/app/(dashboard)/orders/` |
| ✏️ MODIFY | `vastra-express-facility/app/(dashboard)/page.tsx` |
| ✏️ MODIFY | `vastra-express-facility/lib/api.ts` |
| 🗑️ DELETE | `vastra-express-customer/app/(tabs)/wallet.tsx` |
| ✏️ MODIFY | `vastra-express-customer/app/(tabs)/_layout.tsx` |
| ✏️ MODIFY | `vastra-express-customer/app/order/[id].tsx` |
| ✏️ MODIFY | `vastra-express-customer/app/subscription/index.tsx` |
| ✏️ MODIFY | `vastra-express-customer/store/orderStore.ts` |
| ✏️ MODIFY | `vastra-express-customer/store/subscriptionStore.ts` |
| ✏️ MODIFY | `vastra-express-customer/lib/api.ts` |
| ✏️ MODIFY | `vastra-express-customer/types/index.ts` |
| ✏️ MODIFY | `vastra-express-customer/constants/index.ts` |
| ✏️ MODIFY | `vastra-express-customer-web/app/(portal)/orders/` |
| ✏️ MODIFY | `vastra-express-customer-web/lib/api.ts` |
| ✏️ MODIFY | `vastra-express-customer-web/types/index.ts` |

**Driver app / driver web:** No changes needed.

---

*End of V2 Migration Guide*
