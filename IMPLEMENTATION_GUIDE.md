# IMPLEMENTATION GUIDE
## Vastra Express - Quick Commerce Laundry Platform

**Version:** 2.0  
**Created:** February 19, 2026  
**Last Updated:** March 4, 2026  
**Source Documents:**
- SRS V1.md
- Vastra Express V1.md
- SOFTWARE REQUIREMENTS SPECIFICATION.md

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Tech Stack (Verified)](#tech-stack-verified)
3. [Database Schema Design](#database-schema-design)
4. [Milestone Breakdown](#milestone-breakdown)
5. [Phase 1: Backend Core](#phase-1-backend-core) ✅
6. [Phase 2: Admin Panel (Web)](#phase-2-admin-panel-web) ✅
7. [Phase 3: Processing Facility Dashboard (Web)](#phase-3-processing-facility-dashboard-web) ✅
8. [Phase 4: Driver App (Expo Mobile)](#phase-4-driver-web-app-expo) ✅
9. [Phase 5: Customer App (Expo Mobile)](#phase-5-customer-web-app-expo) ✅
10. [Phase 6: Customer & Driver Web (Next.js)](#phase-6-customer--driver-web-nextjs) ✅
11. [Phase 7: Android APK Conversion](#phase-7-android-app-conversion)
12. [Phase 8: Production Hardening](#phase-8-production-hardening)
13. [Environment Setup](#environment-setup)
14. [Deployment Strategy](#deployment-strategy)

---

## PROJECT OVERVIEW

### System Architecture Components
**Source:** SRS V1.md Section 2.1

1. Mobile Application (Customer) - React Native
2. Web Dashboard (Delivery Drivers) - Next.js
3. Web Dashboard (Processing Facility) - Next.js
4. Web Dashboard (Admin) - Next.js
5. Backend API Server - Node.js + Express/NestJS
6. Database - MySQL 8.0
7. Payment Integration - Razorpay
8. Notifications - Firebase + MSG91 SMS

### User Roles & Access
**Source:** Vastra Express V1.md Section 4

1. **Customer** - Mobile App Only
2. **Delivery Partner** - Mobile App (Phase 4+) / Web Panel
3. **Facility Staff** - Shared Web Portal (common login for all facility staff across all facilities)
4. **Admin** - Dedicated Web Admin Panel (pre-seeded single account, username/password login)

> **Admin Authentication Note:** There is no self-registration for admin. A single admin account is pre-seeded in the database on first boot. Login is via `username` + `password` (not OTP). Credentials are set via environment variables `ADMIN_USERNAME` / `ADMIN_PASSWORD` (defaults: `admin` / `password` — **must be changed before production**).

> **Facility Staff Portal Note:** All facility staff share one web portal. Accounts are created by Admin (name + mobile + role — no self-registration). Staff use a **password + OTP hybrid** flow:
> - **First login:** Staff enters mobile → OTP is auto-sent for identity verification → Staff sets a permanent password → Logged in.
> - **Subsequent logins:** Staff enters mobile + password (no OTP required every time).

### Order Lifecycle (Complete State Machine)
**Source:** Vastra Express V1.md Section 5

**Main Flow:**
```
ORDER_CREATED
→ ORDER_CONFIRMED
→ PICKUP_SCHEDULED
→ PICKUP_ASSIGNED
→ OUT_FOR_PICKUP
→ PICKUP_ARRIVED
→ PICKED_UP
→ RECEIVED_AT_FACILITY
→ SORTING
→ WASHING
→ IRONING
→ PACKING
→ BILL_GENERATED
→ READY_FOR_DISPATCH
→ DELIVERY_ASSIGNED
→ OUT_FOR_DELIVERY
→ DELIVERY_ARRIVED
→ DELIVERED
```

**Alternate States:**
- CANCELLED
- PICKUP_FAILED
- PROCESSING_ISSUE
- DELIVERY_FAILED
- REFUND_INITIATED

---

## TECH STACK (VERIFIED)

### Backend
**Source:** SRS V1.md Section 5

- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS 10
- **ORM:** Prisma
- **Database:** MySQL 8.0
- **Authentication:** JWT + bcrypt
- **Validation:** class-validator

### Web Dashboards (Admin, Facility, Driver)
**Source:** SRS V1.md Section 5

- **Framework:** Next.js 14
- **UI Library:** React 18
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4
- **State Management:** React Context / Zustand
- **HTTP Client:** Axios

### Mobile App (Customer)
**Source:** SRS V1.md Section 5

- **Framework:** React Native 0.73+
- **Language:** TypeScript
- **State Management:** Redux Toolkit / Zustand
- **Navigation:** React Navigation
- **Push Notifications:** Firebase Cloud Messaging

### External Services

- **Payment Gateway:** Razorpay
- **Push Notifications:** Firebase Cloud Messaging
- **SMS OTP:** MSG91 API
- **Hosting:** Hostinger VPS (Ubuntu 22.04)
- **Web Server:** NGINX
- **Process Manager:** PM2
- **SSL:** Let's Encrypt

---

## DATABASE SCHEMA DESIGN

### Core Entities
**Source:** SRS V1.md Section 6

#### 1. Users & Authentication
```
users
- id (PK)
- mobile_number (UNIQUE)
- name
- email (NULLABLE)
- username (UNIQUE, NULLABLE)        -- used for admin/staff web login
- password_hash (NULLABLE)           -- bcrypt hash, used for admin web login
- role_id (FK -> roles)
- is_active
- created_at
- updated_at

roles
- id (PK)
- name (ENUM: CUSTOMER, ADMIN, FACILITY_STAFF, DRIVER)
- permissions (JSON)
- created_at
```

#### 2. Address Management
```
addresses
- id (PK)
- user_id (FK -> users)
- house_flat_no
- street
- landmark
- pincode
- city_id (FK -> cities)
- is_default
- created_at
- updated_at

cities (future-ready)
- id (PK)
- name
- state
- is_active
- created_at
```

#### 3. Facilities
```
facilities
- id (PK)
- name
- city_id (FK -> cities)
- address
- contact_number
- is_active
- created_at
- updated_at

staff
- id (PK)
- user_id (FK -> users)
- facility_id (FK -> facilities, NULLABLE for admin)
- role_id (FK -> roles)
- created_at
- updated_at
```

#### 4. Pickup Slots
**Source:** SRS V1.md Section 3.3

```
pickup_slots
- id (PK)
- facility_id (FK -> facilities)
- slot_date
- start_time
- end_time
- max_capacity (future use)
- current_bookings
- is_active
- created_at
- updated_at
```

#### 5. Orders
**Source:** SRS V1.md Section 3.4, Vastra Express V1.md Section 5

```
orders
- id (PK)
- order_number (UNIQUE, auto-generated)
- customer_id (FK -> users)
- address_id (FK -> addresses)
- facility_id (FK -> facilities)
- pickup_slot_id (FK -> pickup_slots)
- current_status (ENUM - from order lifecycle)
- service_type (ENUM: WASH_FOLD, DRY_CLEAN, IRON_ONLY)
- is_express
- initial_weight (kg, entered by driver)
- final_weight (kg, confirmed by facility)
- subscription_id (FK -> subscriptions, NULLABLE)
- customer_notes
- created_at
- updated_at

order_status_history
- id (PK)
- order_id (FK -> orders)
- status (ENUM - from order lifecycle)
- changed_by_user_id (FK -> users)
- notes
- timestamp
- created_at
```

#### 6. Order Items (Itemized Billing)
**Source:** SRS V1.md Section 3.5

```
order_items
- id (PK)
- order_id (FK -> orders)
- item_name (e.g., "Shirt", "Trouser")
- quantity
- service_type (ENUM: WASH_FOLD, DRY_CLEAN, IRON_ONLY)
- price_per_item
- total_price
- created_at
- updated_at
```

#### 7. Pricing Configuration
**Source:** SRS V1.md Section 3.5

```
pricing_configurations
- id (PK)
- city_id (FK -> cities, NULLABLE for global)
- service_type (ENUM: WASH_FOLD, DRY_CLEAN, IRON_ONLY)
- price_per_kg
- item_name (NULLABLE for per-item pricing)
- price_per_item (NULLABLE)
- minimum_order_value
- express_delivery_charge
- pickup_delivery_charge_non_subscriber
- is_active
- effective_from
- created_at
- updated_at
```

#### 8. Subscriptions
**Source:** SRS V1.md Section 3.6

```
subscriptions
- id (PK)
- customer_id (FK -> users)
- plan_id (FK -> subscription_plans)
- wallet_balance
- start_date
- end_date
- is_active
- auto_renew
- created_at
- updated_at

subscription_plans
- id (PK)
- name
- description
- duration_days
- price
- wallet_credit
- benefits (JSON: free_pickup, discounts, etc.)
- is_active
- created_at
- updated_at

wallet_transactions
- id (PK)
- subscription_id (FK -> subscriptions)
- order_id (FK -> orders, NULLABLE)
- transaction_type (ENUM: CREDIT, DEBIT, REFUND)
- amount
- balance_after
- description
- created_at
```

#### 9. Payments
**Source:** SRS V1.md Section 3.7

```
payments
- id (PK)
- order_id (FK -> orders)
- payment_method (ENUM: RAZORPAY_UPI, RAZORPAY_CARD, COD, WALLET)
- payment_status (ENUM: PENDING, COMPLETED, FAILED, REFUNDED)
- razorpay_order_id (NULLABLE)
- razorpay_payment_id (NULLABLE)
- amount
- gst_amount
- total_amount
- paid_at
- created_at
- updated_at

refunds
- id (PK)
- payment_id (FK -> payments)
- order_id (FK -> orders)
- amount
- reason
- status (ENUM: INITIATED, PROCESSED, FAILED)
- processed_by_user_id (FK -> users)
- processed_at
- created_at
- updated_at
```

#### 10. Delivery Assignments
**Source:** SRS V1.md Section 2.2

```
delivery_assignments
- id (PK)
- order_id (FK -> orders)
- driver_id (FK -> users)
- assignment_type (ENUM: PICKUP, DELIVERY)
- assigned_by_user_id (FK -> users)
- assigned_at
- status (ENUM: ASSIGNED, IN_PROGRESS, COMPLETED, FAILED)
- completed_at
- notes
- created_at
- updated_at
```

#### 11. Inventory Management
**Source:** SRS V1.md Section 3.9

```
inventory_items
- id (PK)
- facility_id (FK -> facilities)
- item_name
- category (ENUM: DETERGENT, PACKAGING, TAG, MACHINERY, MISC)
- quantity
- unit (e.g., "kg", "pieces")
- low_stock_threshold
- created_at
- updated_at

inventory_logs
- id (PK)
- inventory_item_id (FK -> inventory_items)
- transaction_type (ENUM: ADDITION, CONSUMPTION, ADJUSTMENT)
- quantity_change
- balance_after
- notes
- created_by_user_id (FK -> users)
- created_at
```

#### 12. Reviews
**Source:** SRS V1.md Section 2.2

```
reviews
- id (PK)
- order_id (FK -> orders)
- customer_id (FK -> users)
- rating (1-5)
- comment
- created_at
- updated_at
```

### Database Indexes (Performance Optimization)
**Source:** SRS V1.md Section 4.1

```sql
-- Users
INDEX idx_users_mobile (mobile_number)
INDEX idx_users_role (role_id)

-- Orders
INDEX idx_orders_customer (customer_id)
INDEX idx_orders_status (current_status)
INDEX idx_orders_facility (facility_id)
INDEX idx_orders_created (created_at)

-- Order Status History
INDEX idx_status_history_order (order_id)
INDEX idx_status_history_timestamp (timestamp)

-- Delivery Assignments
INDEX idx_delivery_driver (driver_id)
INDEX idx_delivery_order (order_id)

-- Payments
INDEX idx_payments_order (order_id)
INDEX idx_payments_status (payment_status)
```

---

## MILESTONE BREAKDOWN

### Actual Timeline (Solo Developer)
**Source:** SRS V1.md Section 7

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Backend Core (NestJS + Prisma + MySQL) | ✅ Complete |
| Phase 2 | Admin Panel (Next.js) | ✅ Complete |
| Phase 3 | Facility Portal (Next.js) | ✅ Complete |
| Phase 4 | Driver Mobile App (Expo React Native) | ✅ Complete |
| Phase 5 | Customer Mobile App (Expo React Native) | ✅ Complete |
| Phase 6 | Customer & Driver Web Apps (Next.js) | ✅ Complete |
| Phase 7 | Android APK Conversion (EAS Build) | ⏳ Pending |
| Phase 8 | Production Hardening & Deployment | ⏳ Pending |

**Note:** The original plan had 5 phases. The project expanded to include two additional Next.js web apps (customer-web and driver-web) as standalone platforms before Android APK generation. Phase numbering has been updated accordingly.

---

## PHASE 1: BACKEND CORE

**Duration:** Week 1 (7 days)  
**Objective:** Build complete REST API with authentication, order management, billing engine, and subscription system.

### 1.1 Project Setup (Day 1 - Morning)

#### Step 1: Initialize NestJS Project
```bash
npm i -g @nestjs/cli
nest new vastra-express-backend
cd vastra-express-backend
```

#### Step 2: Install Core Dependencies
```bash
npm install @nestjs/config
npm install @nestjs/jwt
npm install @nestjs/passport passport passport-jwt
npm install @prisma/client
npm install bcrypt
npm install class-validator class-transformer

npm install -D @types/bcrypt
npm install -D @types/passport-jwt
npm install -D prisma
```

#### Step 3: Install Additional Services
```bash
# Payment Integration
npm install razorpay

# Notifications
npm install firebase-admin
npm install axios  # For MSG91 SMS API

# Utilities
npm install moment
npm install uuid
```

#### Step 4: Initialize Prisma
```bash
npx prisma init
```

**Configure `.env`:**
```
DATABASE_URL="mysql://user:password@localhost:3306/vastra_express"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRATION="7d"

# Admin Panel Credentials (pre-seeded on first boot)
# ⚠️  CHANGE THESE BEFORE PRODUCTION
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="password"

# Razorpay (TEMPORARY - Replace with actual keys)
RAZORPAY_KEY_ID="rzp_test_XXXXXXXXXXXX"
RAZORPAY_KEY_SECRET="TEMP_SECRET_REPLACE_LATER"
# 📌 REMINDER: Obtain actual Razorpay test keys before Day 5 (Payment Integration)

FIREBASE_SERVICE_ACCOUNT_PATH=""

MSG91_AUTH_KEY=""
MSG91_TEMPLATE_ID=""
```

### 1.2 Database Schema Implementation (Day 1 - Afternoon)

#### Step 1: Create Prisma Schema
**File:** `prisma/schema.prisma`

Based on Database Schema Design section above, create complete Prisma models for:
- User, Role
- Address, City
- Facility, Staff
- PickupSlot
- Order, OrderStatusHistory, OrderItem
- PricingConfiguration
- Subscription, SubscriptionPlan, WalletTransaction
- Payment, Refund
- DeliveryAssignment
- InventoryItem, InventoryLog
- Review

#### Step 2: Run Migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 1.3 Authentication Module (Day 2)

**Source:** SRS V1.md Section 3.1

#### Authentication Strategy by Portal

| Portal | Auth Method | Who |
|---|---|---|
| Admin Web Panel | Username + Password | Single pre-seeded admin account |
| Facility Staff Web Portal | Password + OTP (first-time setup only) | All facility staff (accounts created by Admin — no self-registration) |
| Customer Mobile App | OTP (SMS) | All customers (self-registration) |
| Driver Mobile App | OTP (SMS) | Drivers (accounts created by Admin) |

#### Module Structure
```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── send-otp.dto.ts
│   │   ├── verify-otp.dto.ts
│   │   ├── login.dto.ts
│   │   ├── staff-check.dto.ts
│   │   ├── staff-setup.dto.ts
│   │   └── staff-login.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       ├── current-user.decorator.ts
│       └── roles.decorator.ts
```

#### Endpoints Required
```
POST   /auth/admin-login     - Admin login (username + password)
POST   /auth/send-otp        - Send OTP to mobile (customers, drivers)
POST   /auth/verify-otp      - Verify OTP & login (or register for customers)
POST   /auth/staff-check     - Check if mobile is a registered FACILITY_STAFF; auto-sends OTP on first login
POST   /auth/staff-setup     - First-time staff login: verify OTP + set password + return JWT
POST   /auth/staff-login     - Returning staff login: mobile + password → JWT
POST   /auth/logout          - Invalidate token
GET    /auth/profile         - Get current user profile
```

#### Implementation Requirements
1. **Admin Account (Pre-seeded)**
   - Created automatically on first boot via `AuthService.seedAdminAccount()`
   - Credentials from `.env`: `ADMIN_USERNAME`, `ADMIN_PASSWORD`
   - Password stored as bcrypt hash (10 rounds)
   - No self-registration endpoint — admin accounts are managed directly in DB

2. **OTP Authentication (Customers / Drivers)**
   - Generate 6-digit OTP
   - Store in-memory with 5-min expiry and 3-attempt lockout
   - Send via MSG91 SMS API
   - `isNewUser` flag returned by `send-otp` to drive registration UX

3. **Facility Staff Authentication (Password + OTP hybrid)**
   - Admin creates staff account (name + mobileNumber + role = FACILITY_STAFF); no password set at creation
   - **First login flow:**
     1. Staff enters mobile → `POST /auth/staff-check` → backend verifies FACILITY_STAFF role, auto-sends OTP, returns `{ exists: true, isFirstLogin: true, name }`
     2. Staff enters OTP + sets new password → `POST /auth/staff-setup` → OTP verified, passwordHash saved, JWT returned
   - **Subsequent login flow:**
     1. Staff enters mobile → `POST /auth/staff-check` → returns `{ exists: true, isFirstLogin: false, name }`
     2. Staff enters password → `POST /auth/staff-login` → bcrypt compare, JWT returned
   - `isFirstLogin` is determined by whether `passwordHash` is null in the database

3. **JWT Token Generation**
   - Payload: `{ sub: userId, role, mobile }`
   - Expiry: 7 days

4. **Role-Based Access Control (RBAC)**
   **Source:** Vastra Express V1.md Section 4
   - Customer: Mobile app only
   - Driver: Mobile app + Driver web panel
   - Facility Staff: Facility web portal (shared login)
   - Admin: Admin web panel only (full access)

5. **Guards Implementation**
   - `JwtAuthGuard` - Verify token
   - `RolesGuard` - Check user role

### 1.4 User Management Module (Day 2)

#### Module Structure
```
src/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-profile.dto.ts
```

#### Endpoints Required
```
GET    /users/profile         - Get current user
PUT    /users/profile         - Update profile
GET    /users                 - [Admin] List all users with pagination
GET    /users/:id             - [Admin] Get user details
POST   /users                 - [Admin] Create staff/driver account (no self-registration)
PATCH  /users/:id/status      - [Admin] Activate/deactivate user
PATCH  /users/:id/role        - [Admin] Change role (DRIVER ↔ FACILITY_STAFF only)
```

#### Staff Account Lifecycle
1. **Admin creates account** via Admin Panel → Users & Staff → "Add Staff":
   - Fields: Full Name, Mobile Number, Role (DRIVER or FACILITY_STAFF), Email (optional)
   - `facilityId` is optional — can be assigned later
   - Account is created with `passwordHash = null`
   - Response includes `isSetupPending: true` for FACILITY_STAFF until first login
2. **Staff first login** → Facility Portal at `http://localhost:3002`:
   - Enters mobile → `POST /auth/staff-check` → OTP auto-sent → sets password → JWT issued
3. **Admin can** deactivate, reactivate, or change role at any time via the Users page

### 1.5 Address Management Module (Day 2)

**Source:** SRS V1.md Section 3.2

#### Module Structure
```
src/
├── addresses/
│   ├── addresses.module.ts
│   ├── addresses.controller.ts
│   ├── addresses.service.ts
│   └── dto/
│       ├── create-address.dto.ts
│       └── update-address.dto.ts
```

#### Endpoints Required
```
POST   /addresses             - Add new address
GET    /addresses             - Get user's addresses
GET    /addresses/:id         - Get specific address
PUT    /addresses/:id         - Update address
DELETE /addresses/:id         - Delete address
PATCH  /addresses/:id/default - Set as default
```

#### Validation Rules
- Pincode must be 6 digits
- City must be active in system
- At least one address required for order

### 1.6 Pickup Slot Management Module (Day 3)

**Source:** SRS V1.md Section 3.3

#### Module Structure
```
src/
├── pickup-slots/
│   ├── pickup-slots.module.ts
│   ├── pickup-slots.controller.ts
│   ├── pickup-slots.service.ts
│   └── dto/
│       ├── create-slot.dto.ts
│       ├── update-slot.dto.ts
│       └── get-available-slots.dto.ts
```

#### Endpoints Required
```
POST   /pickup-slots               - [Facility/Admin] Create slot
GET    /pickup-slots/available     - Get available slots
GET    /pickup-slots               - [Facility/Admin] List all slots
PUT    /pickup-slots/:id           - [Facility/Admin] Update slot
DELETE /pickup-slots/:id           - [Facility/Admin] Delete slot
```

#### Business Rules
- Slots created by facility or admin only
- Cannot book slot if already at capacity
- Rescheduling allowed until 1 hour before
- Cancellation allowed until 1 hour before

### 1.7 Order Management Module (Day 3-4)

**Source:** SRS V1.md Section 3.4, Vastra Express V1.md Section 5

#### Module Structure
```
src/
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   ├── order-state-machine.service.ts
│   ├── dto/
│   │   ├── create-order.dto.ts
│   │   ├── update-order-status.dto.ts
│   │   ├── add-order-items.dto.ts
│   │   └── assign-driver.dto.ts
│   └── enums/
│       └── order-status.enum.ts
```

#### Endpoints Required
```
POST   /orders                    - Create order
GET    /orders                    - Get orders (filtered by role)
GET    /orders/:id                - Get order details
PATCH  /orders/:id/status         - Update order status
POST   /orders/:id/items          - [Facility] Add itemized items
PATCH  /orders/:id/weight         - [Driver/Facility] Update weight
POST   /orders/:id/assign-driver  - [Facility] Assign driver
GET    /orders/:id/history        - Get status history
PATCH  /orders/:id/cancel         - Cancel order
```

#### Order State Machine Implementation
**CRITICAL:** Enforce strict state transitions

**Allowed Transitions:**
```
ORDER_CREATED → ORDER_CONFIRMED
ORDER_CONFIRMED → PICKUP_SCHEDULED
PICKUP_SCHEDULED → PICKUP_ASSIGNED
PICKUP_ASSIGNED → OUT_FOR_PICKUP
OUT_FOR_PICKUP → PICKUP_ARRIVED
PICKUP_ARRIVED → PICKED_UP
PICKED_UP → RECEIVED_AT_FACILITY
RECEIVED_AT_FACILITY → SORTING
SORTING → WASHING
WASHING → IRONING
IRONING → PACKING
PACKING → BILL_GENERATED
BILL_GENERATED → READY_FOR_DISPATCH
READY_FOR_DISPATCH → DELIVERY_ASSIGNED
DELIVERY_ASSIGNED → OUT_FOR_DELIVERY
OUT_FOR_DELIVERY → DELIVERY_ARRIVED
DELIVERY_ARRIVED → DELIVERED

Any state → CANCELLED (before PICKED_UP)
OUT_FOR_PICKUP → PICKUP_FAILED
Any processing state → PROCESSING_ISSUE
OUT_FOR_DELIVERY → DELIVERY_FAILED
DELIVERED → REFUND_INITIATED (if payment refund needed)
```

**Implementation:**
```typescript
// order-state-machine.service.ts
validateTransition(currentStatus, newStatus) {
  // Check if transition is allowed
  // Throw error if invalid
  // Log all transitions in order_status_history
}
```

#### Role-Based Order Access
- **Customer:** See only their orders
- **Driver:** See assigned orders only
- **Facility:** See all orders for their facility
- **Admin:** See all orders globally

### 1.8 Pricing & Billing Module (Day 4)

**Source:** SRS V1.md Section 3.5, 3.7

#### Module Structure
```
src/
├── billing/
│   ├── billing.module.ts
│   ├── billing.controller.ts
│   ├── billing.service.ts
│   ├── pricing.service.ts
│   └── dto/
│       ├── generate-bill.dto.ts
│       └── update-pricing.dto.ts
```

#### Endpoints Required
```
POST   /billing/generate/:orderId  - Generate final bill
GET    /billing/invoice/:orderId   - Get GST invoice
GET    /billing/pricing            - Get current pricing
PUT    /billing/pricing            - [Admin] Update pricing
```

#### Billing Logic
**Hybrid Model:**
```
Base Calculation:
- Weight-based: final_weight × price_per_kg
- Item-based: sum(quantity × price_per_item)

Additional Charges:
- Express delivery: +express_charge
- Pickup/Delivery (non-subscriber): +pickup_charge

Subscription Handling:
- Deduct from wallet if subscription active
- Charge only difference if wallet insufficient

GST Calculation:
- GST: 18% on service charges
- Total = Base + Additional + GST
```

#### Minimum Order Validation
- ₹500 minimum order value
- Enforced before bill generation

### 1.9 Subscription Module (Day 5)

**Source:** SRS V1.md Section 3.6

#### Module Structure
```
src/
├── subscriptions/
│   ├── subscriptions.module.ts
│   ├── subscriptions.controller.ts
│   ├── subscriptions.service.ts
│   ├── wallet.service.ts
│   └── dto/
│       ├── purchase-subscription.dto.ts
│       ├── create-plan.dto.ts
│       └── wallet-transaction.dto.ts
```

#### Endpoints Required
```
GET    /subscriptions/plans           - Get all active plans
POST   /subscriptions/purchase        - Purchase subscription
GET    /subscriptions/my-subscription - Get active subscription
GET    /subscriptions/wallet-history  - Get wallet transactions
POST   /subscriptions/plans           - [Admin] Create plan
PUT    /subscriptions/plans/:id       - [Admin] Update plan
DELETE /subscriptions/plans/:id       - [Admin] Deactivate plan
POST   /subscriptions/refund          - [Admin] Refund wallet
```

#### Subscription Features
1. **Wallet System**
   - Prepaid balance
   - Auto-deduct on order
   - Low balance alert (< ₹100)

2. **Benefits**
   - Free pickup & delivery
   - Discount % (configurable per plan)
   - Priority processing (future)

3. **Auto-Renewal**
   - Check expiry daily (cron job)
   - Charge renewal if auto_renew enabled
   - Deactivate if payment fails

### 1.10 Payment Integration Module (Day 5)

**Source:** SRS V1.md Section 3.7

#### Module Structure
```
src/
├── payments/
│   ├── payments.module.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   ├── razorpay.service.ts
│   └── dto/
│       ├── create-payment.dto.ts
│       └── verify-payment.dto.ts
```

#### Endpoints Required
```
POST   /payments/create-order      - Create Razorpay order
POST   /payments/verify            - Verify payment signature
POST   /payments/webhook           - Razorpay webhook
GET    /payments/history           - Get payment history
POST   /payments/refund/:id        - [Admin] Process refund
```

#### Payment Flow
1. **Before Delivery:**
   - Generate bill
   - Create Razorpay order
   - Customer pays via app
   - Mark order as paid

2. **Cash on Delivery:**
   - Driver collects cash
   - Marks payment received
   - Updates order status

3. **Wallet Payment:**
   - Deduct from subscription wallet
   - Log transaction
   - Update wallet balance

### 1.11 Delivery Assignment Module (Day 6)

**Source:** SRS V1.md Section 2.2

#### Module Structure
```
src/
├── delivery/
│   ├── delivery.module.ts
│   ├── delivery.controller.ts
│   ├── delivery.service.ts
│   └── dto/
│       ├── assign-delivery.dto.ts
│       └── update-delivery-status.dto.ts
```

#### Endpoints Required
```
POST   /delivery/assign           - [Facility] Assign driver
GET    /delivery/my-assignments   - [Driver] Get assigned tasks
PATCH  /delivery/:id/status       - [Driver] Update delivery status
GET    /delivery/orders/:orderId  - Get delivery details
```

#### Assignment Logic
- Manual assignment by facility staff
- Driver can be assigned for:
  - Pickup only
  - Delivery only
  - Both pickup & delivery (same driver)

### 1.12 Inventory Management Module (Day 6)

**Source:** SRS V1.md Section 3.9

#### Module Structure
```
src/
├── inventory/
│   ├── inventory.module.ts
│   ├── inventory.controller.ts
│   ├── inventory.service.ts
│   └── dto/
│       ├── add-inventory.dto.ts
│       ├── update-stock.dto.ts
│       └── log-consumption.dto.ts
```

#### Endpoints Required
```
POST   /inventory                  - [Admin/Facility] Add item
GET    /inventory                  - Get inventory list
PUT    /inventory/:id              - Update item details
POST   /inventory/:id/adjust       - Adjust stock
GET    /inventory/logs             - Get transaction logs
GET    /inventory/low-stock        - Get low stock alerts
```

#### Features
- Track: Detergents, Packaging, Tags, Machinery, Misc
- Log every addition/consumption
- Alert when stock < threshold

### 1.13 Notification Module (Day 7)

**Source:** SRS V1.md Section 3.8

#### Module Structure
```
src/
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.service.ts
│   ├── firebase.service.ts
│   └── sms.service.ts
```

#### Trigger Events
```
- Pickup scheduled
- Pickup completed
- Received at facility
- Bill generated
- Out for delivery
- Delivered
```

#### Implementation
1. **Firebase Push (Mobile App)**
   - Initialize Firebase Admin SDK
   - Store device tokens in users table
   - Send push on order status change

2. **SMS (MSG91)**
   - Template-based messages
   - Trigger for critical events
   - Include order number & status

#### SMS Templates (MSG91)
**Source:** Temporary templates based on notification requirements

**OTP Template:**
```
Your Vastra Express OTP is {otp}. Valid for 5 minutes. Do not share with anyone.
```

**Pickup Scheduled:**
```
Order #{order_number} pickup scheduled for {date} at {time}. Track: {app_link}
- Vastra Express
```

**Pickup Completed:**
```
Order #{order_number} picked up successfully. Weight: {weight}kg. Processing will begin shortly.
- Vastra Express
```

**Received at Facility:**
```
Your laundry (Order #{order_number}) has reached our facility. We'll update you on bill generation.
- Vastra Express
```

**Bill Generated:**
```
Order #{order_number} bill ready: ₹{amount}. Pay now: {payment_link}
- Vastra Express
```

**Out for Delivery:**
```
Your order #{order_number} is out for delivery! Expected by {time}.
- Vastra Express
```

**Delivered:**
```
Order #{order_number} delivered successfully! Rate your experience: {app_link}
- Vastra Express
```

**Template Variables:**
- `{otp}` - 6-digit OTP code
- `{order_number}` - Unique order number
- `{date}` - Pickup date (DD-MM-YYYY)
- `{time}` - Pickup/delivery time slot
- `{weight}` - Laundry weight in kg
- `{amount}` - Bill amount in ₹
- `{app_link}` - Deep link to app
- `{payment_link}` - Payment URL

### 1.14 Reports & Analytics Module (Day 7)

**Source:** SRS V1.md Section 3.11

#### Module Structure
```
src/
├── reports/
│   ├── reports.module.ts
│   ├── reports.controller.ts
│   └── reports.service.ts
```

#### Endpoints Required
```
GET    /reports/dashboard         - [Admin] KPI dashboard
GET    /reports/revenue           - Revenue by date range
GET    /reports/orders-summary    - Orders by status
GET    /reports/subscription-usage - Subscription metrics
GET    /reports/facility          - [Facility] Facility-specific
GET    /reports/driver-performance - Driver statistics
```

#### Admin Dashboard KPIs
- Daily orders count
- Monthly revenue
- Expenses (inventory consumption)
- Subscription usage %
- Order status distribution
- Growth trends (week-over-week)

### 1.15 Backend Testing & Documentation (Day 7)

#### API Documentation
- Use Swagger/OpenAPI
```bash
npm install @nestjs/swagger swagger-ui-express
```

- Document all endpoints with:
  - Request DTOs
  - Response schemas
  - Auth requirements
  - Role restrictions

#### Testing
```bash
npm install -D @nestjs/testing jest supertest
```

- Unit tests for:
  - Order state machine
  - Billing calculations
  - Wallet deductions
  - Price calculations

**Notes:**
- SMS templates documented in Section 1.13
- Razorpay test credentials: Use placeholders from .env
- Firebase setup: Will be configured during Day 24 (Push Notifications)

---

## PHASE 2: ADMIN PANEL (WEB)

**Duration:** Week 2 (7 days)  
**Objective:** Build complete admin web dashboard with all management features.

### 2.1 Project Setup (Day 8)

#### Step 1: Initialize Next.js Project
```bash
npx create-next-app@latest vastra-express-admin
cd vastra-express-admin

# During setup select:
# TypeScript: Yes
# ESLint: Yes
# Tailwind CSS: Yes
# App Router: Yes
```

#### Step 2: Install Dependencies
```bash
npm install axios
npm install zustand  # State management
npm install react-hook-form
npm install @hookform/resolvers yup
npm install recharts  # For charts
npm install date-fns  # Date utilities
npm install react-hot-toast  # Notifications
npm install js-cookie  # JWT storage
```

#### Step 3: Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard home
│   │   ├── orders/
│   │   ├── staff/
│   │   ├── subscriptions/
│   │   ├── pricing/
│   │   ├── inventory/
│   │   ├── reports/
│   │   └── settings/
│   └── layout.tsx
├── components/
│   ├── ui/                        # Reusable UI components
│   ├── forms/
│   ├── tables/
│   └── charts/
├── lib/
│   ├── api.ts                     # Axios instance
│   ├── auth.ts                    # Auth utilities
│   └── utils.ts
├── store/
│   ├── authStore.ts
│   └── ordersStore.ts
└── types/
    └── index.ts                   # TypeScript interfaces
```

### 2.2 Authentication Setup (Day 8)

**Source:** SRS V1.md Section 3.1

> **Admin auth model:** The admin panel does NOT use OTP. There is a single pre-seeded admin account. Login is via username + password (`POST /auth/admin-login`). No registration flow exists for admin.

#### Pages Required
1. **Login Page** - `/login`
   - Username + Password form
   - `POST /auth/admin-login` → `{ username, password }`
   - Response: `{ accessToken, user }` — store JWT in cookie (`ve_admin_token`)
   - Redirect to `/dashboard` on success
   - Display inline error on failure (wrong credentials / account disabled)

2. **Protected Routes**
   - `proxy.ts` middleware checks `ve_admin_token` cookie
   - Redirect to `/login?from=<path>` if not authenticated
   - Verify role = ADMIN on backend (JWT payload)

#### Implementation
```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT to all requests
api.interceptors.request.use((config) => {
  const token = getTokenFromCookie();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
    }
    return Promise.reject(error);
  }
);
```

### 2.3 Dashboard Home (Day 9)

**Source:** SRS V1.md Section 3.11

#### Components Required
1. **KPI Cards**
   - Today's Orders
   - Monthly Revenue
   - Active Subscriptions
   - Pending Deliveries

2. **Charts**
   - Revenue Trend (Last 30 days)
   - Order Status Distribution (Pie Chart)
   - Orders by Service Type (Bar Chart)

3. **Recent Orders Table**
   - Last 10 orders
   - Quick status update
   - View details link

#### API Integration
```
GET /reports/dashboard
GET /orders?limit=10&sort=created_at:desc
```

### 2.4 Order Management (Day 9-10)

**Source:** SRS V1.md Section 3.4, Vastra Express V1.md Section 5

#### Pages
1. **Order List** - `/orders`
   - Filters: Status, Date Range, Customer
   - Search by order number
   - Pagination
   - Bulk actions (future)

2. **Order Details** - `/orders/[id]`
   - Customer info
   - Address
   - Order items (itemized)
   - Status timeline
   - Payment status
   - Update status button
   - Assign driver
   - Add notes

#### Components
```
OrdersTable
- Columns: Order #, Customer, Status, Amount, Date, Actions
- Status badge with color coding
- Quick actions: View, Update Status

OrderStatusTimeline
- Visual timeline of all status changes
- User who made change
- Timestamp
- Notes

UpdateStatusModal
- Dropdown: Next allowed status (from state machine)
- Notes field
- Submit button

AssignDriverModal
- Driver selection dropdown
- Assignment type: Pickup / Delivery
- Auto-update order status
```

#### API Integration
```
GET    /orders?page=1&limit=20&status=PENDING
GET    /orders/:id
PATCH  /orders/:id/status
POST   /orders/:id/assign-driver
```

### 2.5 Staff Management (Day 10)

**Source:** SRS V1.md Section 3.10

#### Pages
1. **Staff List** - `/staff`
   - Filters: Role, Facility, Active Status
   - Add new staff button

2. **Add/Edit Staff** - `/staff/add` or `/staff/[id]/edit`
   - Form fields:
     - Name
     - Mobile Number
     - Role (Driver, Facility Staff)
     - Facility (if Facility Staff)
     - Is Active

#### Components
```
StaffTable
- Columns: Name, Mobile, Role, Facility, Status, Actions

StaffForm
- Validation with yup
- Role-based field display
- Submit handler
```

#### API Integration
```
GET    /users?role=DRIVER,FACILITY_STAFF
POST   /users
PUT    /users/:id
PUT    /users/:id/status
```

### 2.6 Subscription Management (Day 11)

**Source:** SRS V1.md Section 3.6

#### Pages
1. **Subscription Plans** - `/subscriptions/plans`
   - List all plans
   - Create new plan
   - Edit existing plan
   - Activate/Deactivate

2. **Active Subscriptions** - `/subscriptions/active`
   - Filter by customer
   - View wallet balance
   - Refund wallet
   - View usage history

#### Components
```
SubscriptionPlansTable
- Columns: Plan Name, Price, Duration, Wallet Credit, Status

CreatePlanModal
- Fields: Name, Description, Duration, Price, Wallet Credit, Benefits
- Submit handler

WalletTransactionsTable
- Columns: Date, Type, Amount, Balance, Description
```

#### API Integration
```
GET    /subscriptions/plans
POST   /subscriptions/plans
PUT    /subscriptions/plans/:id
GET    /subscriptions (all active subscriptions)
GET    /subscriptions/:id/wallet-history
POST   /subscriptions/refund
```

### 2.7 Pricing Configuration (Day 11)

**Source:** SRS V1.md Section 3.5

#### Page
**Pricing Management** - `/pricing`

#### Components
```
PricingTable
- Per kg pricing for each service type
- Per item pricing (expandable list)
- Minimum order value
- Express charges
- Pickup/delivery charges

EditPricingModal
- Service type selection
- Price input
- Effective from date
- Submit handler
```

#### API Integration
```
GET    /billing/pricing
PUT    /billing/pricing
```

### 2.8 Inventory Management (Day 12)

**Source:** SRS V1.md Section 3.9

#### Pages
1. **Inventory List** - `/inventory`
   - Filter by category
   - Low stock alerts highlighted
   - Add item button

2. **Inventory Logs** - `/inventory/logs`
   - Filter by date, category, transaction type
   - Export to CSV (future)

#### Components
```
InventoryTable
- Columns: Item Name, Category, Quantity, Unit, Low Stock Threshold, Status

AddInventoryModal
- Fields: Item Name, Category, Quantity, Unit, Threshold

AdjustStockModal
- Current quantity display
- Adjustment type: Addition / Consumption
- Quantity change
- Notes
```

#### API Integration
```
GET    /inventory
POST   /inventory
PUT    /inventory/:id
POST   /inventory/:id/adjust
GET    /inventory/logs
GET    /inventory/low-stock
```

### 2.9 Reports & Analytics (Day 13)

**Source:** SRS V1.md Section 3.11

#### Pages
1. **Revenue Report** - `/reports/revenue`
   - Date range selector
   - Total revenue
   - Revenue by service type
   - Revenue by payment method
   - Export button

2. **Orders Summary** - `/reports/orders`
   - Orders by status
   - Orders by date
   - Average order value
   - Subscription vs regular orders

3. **Driver Performance** - `/reports/drivers`
   - Pickups completed
   - Deliveries completed
   - Average time per task
   - Customer ratings (future)

#### API Integration
```
GET    /reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /reports/orders-summary?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /reports/driver-performance?driverId=X
```

### 2.10 Settings (Day 13)

#### Page
**Settings** - `/settings`

#### Sections
1. **Facility Management**
   - Add/Edit facilities
   - Assign city
   - Active status

2. **City Management**
   - Add/Edit cities
   - Active status

3. **Admin Profile**
   - Update name
   - Change mobile number (requires OTP)
   - Logout

### 2.11 UI/UX Polish (Day 14)

#### Tasks
1. **Responsive Design**
   - Mobile-friendly tables (scroll)
   - Hamburger menu for mobile
   - Touch-friendly buttons

2. **Loading States**
   - Skeleton loaders for tables
   - Button loading spinners
   - Page-level loading indicator

3. **Error Handling**
   - Toast notifications for errors
   - Form validation errors
   - API error messages

4. **Accessibility**
   - Keyboard navigation
   - ARIA labels
   - Focus states

---

## PHASE 3: PROCESSING FACILITY DASHBOARD (WEB)

**Duration:** Week 3 (Days 15-18)  
**Objective:** Build facility staff dashboard for order processing and driver management.

### 3.1 Project Setup (Day 15)

**Implementation choice: Separate Next.js App** (`vastra-express-facility`) on port **3002**.

```bash
npx create-next-app@latest vastra-express-facility
```

Key config:
- `NEXT_PUBLIC_API_URL=http://localhost:3000/api`
- Route protection via `proxy.ts` (Next.js 16+ middleware replacement)
- Zustand auth store with `_hasHydrated` guard

### 3.1.1 Facility Staff Authentication Flow

**Admin side:**
- Admin creates staff account via Admin Panel → Users page → "Add Staff" modal
- Fields: Full Name, Mobile Number, Role (FACILITY_STAFF), Facility ID (optional)
- Account is created with **no password** — `passwordHash` is null at creation
- Staff cannot self-register

**Backend endpoints (new, added in Phase 3):**

| Endpoint | Method | Description |
|---|---|---|
| `/auth/staff-check` | POST | Check mobile → returns `{ exists, isFirstLogin, name }`; auto-sends OTP if first login |
| `/auth/staff-setup` | POST | First-time setup: verify OTP + set password + return JWT |
| `/auth/staff-login` | POST | Returning login: mobile + password → JWT |

**Frontend login flow (3 states):**

```
STATE 1 — mobile
  Staff enters 10-digit mobile number
  → POST /auth/staff-check
  If not found: "Not registered. Contact your administrator."
  If isFirstLogin = true: auto-OTP sent → go to STATE 2 (setup)
  If isFirstLogin = false: → go to STATE 3 (password)

STATE 2 — setup (first login only)
  Staff sees: "Account Setup — OTP sent to +91 XXXXXX"
  Fields: OTP (6-digit) + New Password + Confirm Password
  → POST /auth/staff-setup { mobileNumber, otp, password }
  On success: JWT + redirect to dashboard

STATE 3 — password (returning login)
  Staff sees: "Welcome back, [name]!"
  Field: Password
  → POST /auth/staff-login { mobileNumber, password }
  On success: JWT + redirect to dashboard
```

**`isFirstLogin` logic:** `user.passwordHash === null` in database.

**Security notes:**
- `staff-check` returns generic `{ exists: false }` for any non-FACILITY_STAFF mobile (prevents user enumeration)
- Inactive accounts throw `401` immediately
- OTP rate-limited: 1-minute cooldown, 3-attempt lockout, 5-min expiry
- Passwords hashed with bcrypt (10 rounds)

### 3.2 Facility Dashboard Home (Day 15)

**Source:** SRS V1.md Section 3.11

#### Components
1. **Facility KPIs**
   - Orders in Processing
   - Pending Pickups
   - Ready for Delivery
   - Low Stock Items

2. **Processing Pipeline**
   - Visual board (Kanban-style):
     - Received
     - Sorting
     - Washing
     - Ironing
     - Packing
     - Ready for Dispatch

3. **Driver Status**
   - Available drivers
   - Active pickups
   - Active deliveries

### 3.3 Order Processing (Day 16)

**Source:** Vastra Express V1.md Section 4 - Facility Staff Role

#### Features
1. **Order View**
   - Filter by status
   - Search by order number
   - View customer notes

2. **Update Processing Status**
   - Move through: SORTING → WASHING → IRONING → PACKING
   - Add processing notes
   - Report damage/issues

3. **Weight Confirmation**
   - Driver enters initial weight (pickup)
   - Facility confirms final weight
   - Auto-trigger bill generation if weights differ

4. **Itemized Billing**
   - Add individual items:
     - Item name (dropdown or custom)
     - Quantity
     - Service type
     - Auto-calculate price
   - Generate final bill

### 3.4 Pickup Slot Management (Day 16)

**Source:** SRS V1.md Section 3.3

#### Page
**Slot Management** - `/facility/slots`

#### Features
1. **Calendar View**
   - View slots by date
   - Create new slots
   - Edit existing slots
   - Delete slots

2. **Slot Details**
   - Date, Start Time, End Time
   - Current bookings / Max capacity
   - Active status

### 3.5 Driver Assignment (Day 17)

**Source:** SRS V1.md Section 2.2 - Delivery Driver

#### Page
**Driver Management** - `/facility/drivers`

#### Features
1. **Available Drivers List**
   - Name
   - Current status (Available, On Pickup, On Delivery)
   - Today's completed tasks

2. **Assign to Order**
   - From order details page
   - Select driver
   - Select assignment type:
     - Pickup only
     - Delivery only
     - Both
   - Auto-update order status

3. **View Driver Tasks**
   - Assigned pickups
   - Assigned deliveries
   - Completion status

### 3.6 Inventory Access (Day 17)

**Source:** SRS V1.md Section 3.9

#### Features
- Same as Admin inventory module
- Facility staff can:
  - View inventory
  - Add items
  - Log consumption
  - View logs
- Cannot delete items (Admin only)

### 3.7 Facility-Specific Reports (Day 18)

#### Page
**Reports** - `/facility/reports`

#### Reports
1. **Daily Summary**
   - Orders received
   - Orders processed
   - Orders dispatched
   - Revenue generated

2. **Processing Efficiency**
   - Average time in each stage
   - Bottleneck identification

3. **Inventory Consumption**
   - Items used today/this week
   - Projected stock-out dates

---

## PHASE 4: DRIVER APP (EXPO MOBILE) ✅ COMPLETE

**Duration:** Week 4 (Days 22-27)
**Status:** ✅ Complete — running at `http://localhost:3003` (web preview)
**Objective:** Build the driver-facing app using Expo — runs as a web app for preview, will be compiled to Android APK in Phase 7.

> **Why Expo over Next.js for Driver & Customer apps:**
> The facility portal and admin panel are Next.js (server-rendered web only). The driver and customer apps need to eventually run as Android APKs. Expo uses React Native components with `react-native-web`, meaning the **exact same codebase** that serves the web build is compiled to Android via `eas build`. No rewrite. No second framework. Just a single `expo start --web` for development and `eas build --platform android` for the APK.

> **Architecture Note (Updated):** An additional separate Next.js Driver Web app (`vastra-express-driver-web`) has been built in Phase 6 as a browser-first operational dashboard. The Expo app (`vastra-express-driver`) remains the codebase that will be compiled to the Android APK in Phase 7.

**Project name:** `vastra-express-driver`
**Dev port (web):** 3003
**Android (Phase 7):** compiles to `com.vastraexpress.driver` APK

### 4.1 Project Setup

#### Step 1: Initialize Expo Project
```bash
npx create-expo-app@latest vastra-express-driver --template blank-typescript
cd vastra-express-driver
```

#### Step 2: Install Expo Router & Core Dependencies
```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar expo-font
npx expo install @react-native-async-storage/async-storage expo-secure-store
npm install axios zustand react-hook-form
npm install @expo/vector-icons
```

#### Step 3: Web Support
```bash
npx expo install react-native-web react-dom @expo/metro-runtime
```

#### Step 4: Configure app.json
```json
{
  "expo": {
    "name": "Vastra Express Driver",
    "slug": "vastra-express-driver",
    "scheme": "vastradriver",
    "version": "1.0.0",
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/favicon.png"
    },
    "platforms": ["android", "web"]
  }
}
```

#### Step 5: Configure .env
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

#### Run as Web (Development)
```bash
npx expo start --web
# Opens at http://localhost:8081
# For port 3003:
npx expo start --web --port 3003
```

### 4.2 Project Structure

```
vastra-express-driver/
├── app/
│   ├── _layout.tsx              # Root layout (auth check)
│   ├── index.tsx                # Entry → redirect to login or tasks
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx            # Mobile number input
│   │   └── otp.tsx              # OTP verification
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tab nav (web: top nav)
│       ├── index.tsx            # My Tasks (home)
│       ├── task/
│       │   └── [id].tsx         # Task detail + status update
│       └── profile.tsx          # Driver profile + logout
├── components/
│   ├── TaskCard.tsx
│   ├── StatusBadge.tsx
│   └── OTPInput.tsx
├── lib/
│   ├── api.ts                   # Axios instance with JWT interceptor
│   ├── storage.ts               # expo-secure-store wrapper (web: localStorage)
│   └── utils.ts
├── store/
│   └── authStore.ts             # Zustand auth store
└── types/
    └── index.ts
```

### 4.3 Authentication

Reuses existing backend endpoints (same as customers/drivers — OTP-based):

```
POST /auth/send-otp   { mobileNumber }          → sends OTP
POST /auth/verify-otp { mobileNumber, otp }     → returns { accessToken, user, isNewUser }
```

**Token storage:**
- **Android (Phase 7):** `expo-secure-store` (encrypted keystore)
- **Web (Phase 4):** `localStorage` (with the same API via a thin wrapper)

```typescript
// lib/storage.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const storage = {
  set: (key: string, value: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
  get: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  delete: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.removeItem(key))
      : SecureStore.deleteItemAsync(key),
};
```

**Login flow:**
1. Driver enters 10-digit mobile → `POST /auth/send-otp`
2. Enter OTP → `POST /auth/verify-otp`
3. Role checked: must be `DRIVER` — if not, show "Not authorized as a driver"
4. JWT + user stored → redirect to `/` (Tasks)

### 4.4 Home — My Tasks Screen

Displays driver's active assignments in two tabs:

**Pickup Tasks** — `GET /delivery/my-assignments?type=PICKUP`
- Orders in states: `PICKUP_ASSIGNED`, `OUT_FOR_PICKUP`, `PICKUP_ARRIVED`

**Delivery Tasks** — `GET /delivery/my-assignments?type=DELIVERY`
- Orders in states: `DELIVERY_ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERY_ARRIVED`

Each `TaskCard` shows:
- Order number + service type badge
- Customer name
- Address (pickup or delivery)
- Time slot
- Current status badge
- "View Details" button

Empty state: "No tasks assigned. Check back later."

Pull-to-refresh on web (button) / native pull gesture on Android.

### 4.5 Task Detail Screen — `/task/[id]`

Full order detail with context-aware action buttons:

**Status → Available Actions:**

| Current Status | Primary Action | API Call |
|---|---|---|
| `PICKUP_ASSIGNED` | Start Pickup | `PATCH /delivery/:id/status` → `OUT_FOR_PICKUP` |
| `OUT_FOR_PICKUP` | Arrived at Customer | → `PICKUP_ARRIVED` |
| `PICKUP_ARRIVED` | Confirm Pickup (+ weight) | → `PICKED_UP` + `PATCH /orders/:id/weight` |
| `DELIVERY_ASSIGNED` | Start Delivery | → `OUT_FOR_DELIVERY` |
| `OUT_FOR_DELIVERY` | Arrived at Customer | → `DELIVERY_ARRIVED` |
| `DELIVERY_ARRIVED` | Mark Delivered | → `DELIVERED` |

**Failure Actions (always visible when applicable):**
- "Report Pickup Failed" → `PICKUP_FAILED`
- "Report Delivery Failed" → `DELIVERY_FAILED`

**Screen sections:**
- Order header (number, status badge, created date)
- Customer info (name, mobile)
- Address (full address with map link on web)
- Pickup slot (date + time)
- Current status with timestamp
- Notes from facility (if any)
- **Weight entry form** (shown at `PICKUP_ARRIVED` step only)

#### Weight Entry
```typescript
// At PICKUP_ARRIVED → PICKED_UP transition
const handlePickupConfirm = async (initialWeight: number) => {
  await api.patch(`/orders/${orderId}/weight`, { initialWeight });
  await api.patch(`/delivery/${assignmentId}/status`, { status: 'PICKED_UP' });
  router.back();
};
```

### 4.6 Profile Screen

- Driver name + mobile number
- Today's stats: pickups completed, deliveries completed
- Logout button (clears secure storage, redirects to login)

### 4.7 Shared Components & Utilities

| Component | Purpose |
|---|---|
| `StatusBadge` | Color-coded status chip (matches admin panel styling) |
| `TaskCard` | Reusable pickup/delivery task summary card |
| `OTPInput` | 6-box OTP entry (web keyboard + native numpad) |
| `LoadingScreen` | Full-screen spinner |
| `EmptyState` | Illustration + message for empty lists |

### 4.8 Driver App Testing Checklist

- [ ] OTP login with valid driver account
- [ ] Redirect to "Contact admin" if role is not DRIVER
- [ ] Pickup task list loads correctly
- [ ] Delivery task list loads correctly
- [ ] Task detail shows correct info
- [ ] All status transitions work (each step)
- [ ] Weight entry saves correctly
- [ ] Pickup failed / Delivery failed flow
- [ ] Profile screen shows correct stats
- [ ] Logout clears session
- [ ] Web app loads cleanly at `http://localhost:3003`

---

## PHASE 5: CUSTOMER APP (EXPO MOBILE) ✅ COMPLETE

**Duration:** Week 5 (Days 28-35)
**Status:** ✅ Complete — running at `http://localhost:3004` (web preview)
**Objective:** Build the customer-facing app using Expo — runs as a web app for preview, will be compiled to Android APK in Phase 7.

> **Architecture Note (Updated):** An additional separate Next.js Customer Web app (`vastra-express-customer-web`) has been built in Phase 6 as a public-facing website with landing page + booking portal. The Expo app (`vastra-express-customer`) remains the codebase that will be compiled to the Android APK in Phase 7.

**Project name:** `vastra-express-customer`
**Dev port (web):** 3004
**Android (Phase 7):** compiles to `com.vastraexpress.customer` APK

### 5.1 Project Setup

#### Step 1: Initialize Expo Project
```bash
npx create-expo-app@latest vastra-express-customer --template blank-typescript
cd vastra-express-customer
```

#### Step 2: Install Dependencies
```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar expo-font
npx expo install @react-native-async-storage/async-storage expo-secure-store
npx expo install expo-web-browser   # For Razorpay web checkout
npm install axios zustand react-hook-form
npm install @expo/vector-icons

# Web support
npx expo install react-native-web react-dom @expo/metro-runtime
```

#### Step 3: Configure app.json
```json
{
  "expo": {
    "name": "Vastra Express",
    "slug": "vastra-express-customer",
    "scheme": "vastraexpress",
    "version": "1.0.0",
    "web": {
      "bundler": "metro",
      "output": "single"
    },
    "platforms": ["android", "web"]
  }
}
```

#### Run as Web (Development)
```bash
npx expo start --web --port 3004
# Opens at http://localhost:3004
```

### 5.2 Project Structure

```
vastra-express-customer/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx                    # Entry → redirect
│   ├── (auth)/
│   │   ├── login.tsx                # Mobile number input
│   │   └── otp.tsx                  # OTP + auto-register
│   ├── (tabs)/
│   │   ├── _layout.tsx              # Bottom tab nav
│   │   ├── index.tsx                # Home screen
│   │   ├── orders.tsx               # Order list (Active/Completed/Cancelled)
│   │   ├── subscription.tsx         # My subscription + wallet
│   │   └── profile.tsx
│   ├── address/
│   │   ├── index.tsx                # Address list
│   │   └── [id].tsx                 # Add / Edit address
│   ├── order/
│   │   ├── create/
│   │   │   ├── _layout.tsx
│   │   │   ├── step1.tsx            # Select address
│   │   │   ├── step2.tsx            # Select pickup slot
│   │   │   └── step3.tsx            # Service type + confirm
│   │   └── [id].tsx                 # Order detail + tracking
│   ├── plans/
│   │   ├── index.tsx                # Subscription plans list
│   │   └── purchase.tsx             # Purchase flow
│   └── payment/
│       └── [orderId].tsx            # Payment screen
├── components/
│   ├── OrderCard.tsx
│   ├── StatusTimeline.tsx
│   ├── SubscriptionBadge.tsx
│   ├── SlotPicker.tsx
│   └── AddressCard.tsx
├── lib/
│   ├── api.ts
│   ├── storage.ts                   # Same as driver app
│   └── utils.ts
├── store/
│   └── authStore.ts
└── types/
    └── index.ts
```

### 5.3 Authentication (OTP — Customer Self-Register)

```
POST /auth/send-otp   { mobileNumber }
POST /auth/verify-otp { mobileNumber, otp }
  → Response: { accessToken, user, isNewUser }
  → isNewUser = true: new account auto-created with role CUSTOMER
  → isNewUser = false: existing login
```

No separate registration form — account created automatically on first OTP verification.

### 5.4 Home Screen

**Header:**
- "Hello, [Name]" greeting
- Subscription badge (plan name + wallet balance) if active
- Notification bell (Phase 6)

**Primary CTA:**
- Large "Book a Pickup" button → navigates to `/order/create/step1`

**Active Orders section:**
- Up to 3 most recent in-progress orders
- Each shows: order number, current status badge, last updated time
- "View All" → navigates to `/orders`

**Bottom Tabs:** Home | Orders | Subscription | Profile

API: `GET /orders?status=active&limit=3`

### 5.5 Address Management

**Address List Screen (`/address`):**
- All saved addresses
- Default badge on primary address
- "Add New Address" button
- Swipe-to-delete (Android) / delete button (web)
- Tap to edit

**Add/Edit Address Screen (`/address/[id]`):**

Form fields:
- House / Flat No (required)
- Street (required)
- Landmark (optional)
- Pincode — 6 digits (auto-fetches city on blur via lookup)
- City — read-only (populated from pincode)
- "Set as default" checkbox

API: `GET/POST/PUT/DELETE /addresses`, `PATCH /addresses/:id/default`

### 5.6 Order Creation Flow (3 Steps)

**Step 1 — Select Address (`/order/create/step1`):**
- List of saved addresses as selectable cards
- Selected card gets a highlight border
- "Add New Address" shortcut (opens add form, returns with new address selected)
- "Next" button (disabled until selection made)

**Step 2 — Select Pickup Slot (`/order/create/step2`):**
- Horizontal scrollable date strip (next 7 days)
- Below: time slot buttons for selected date (from `/pickup-slots/available`)
- Slot shows: `10:00 AM – 12:00 PM` format
- Full slots greyed out with "Fully Booked" label
- "Next" button

**Step 3 — Confirm Order (`/order/create/step3`):**
- Service type: Wash & Fold | Dry Clean | Iron Only (radio buttons)
- Express toggle (shows express surcharge if enabled)
- Customer notes text area (optional)
- Summary card: selected address, slot, service type, estimated price range
- "Confirm & Book" → `POST /orders`
- On success: navigate to `/order/[newOrderId]`

### 5.7 Order Tracking Screen (`/order/[id]`)

**Status Timeline Component:**
- Vertical stepper showing all order states
- Completed steps: green with tick
- Current step: highlighted with pulse animation
- Future steps: grey

**Sections:**
1. Order header — order number, created date, service type badge
2. Status timeline
3. Order details — address, pickup slot, notes, initial weight, final weight
4. Bill section (visible once `BILL_GENERATED`):
   - Item breakdown (if itemized)
   - Weight-based charges
   - Express charges (if any)
   - GST (18%)
   - Total
   - Payment status badge
   - "Pay Now" button (if unpaid) → `/payment/[orderId]`
   - "Download Invoice" button (if paid)
5. Actions:
   - "Cancel Order" (visible if status is before `PICKED_UP`)
   - "Rate & Review" (visible if `DELIVERED`)

API: `GET /orders/:id`, `PATCH /orders/:id/cancel`

### 5.8 Order List Screen (`/orders`)

**Tabs:** Active | Completed | Cancelled

Each tab:
- Paginated order cards
- Order card: order number, date, service type, status badge, amount (if billed)
- Tap → navigates to `/order/[id]`
- Pull to refresh

API: `GET /orders?page=1&limit=20` (filtered by tab)

### 5.9 Subscription Screens

**Plans Screen (`/plans`):**
- Cards for each active plan
- Shows: name, price, duration, wallet credit, benefits list
- "Get Started" button → `/plans/purchase?planId=X`

**Purchase Screen (`/plans/purchase`):**
- Selected plan summary
- Payment via Razorpay (web checkout in Phase 5, native SDK in Phase 6)
- On success: redirect to home with success banner

**My Subscription Screen (`/subscription`):**
- Active plan name + expiry date
- Wallet balance (large, prominent display)
- Auto-renew toggle
- "Wallet Transaction History" expandable list
- "Upgrade Plan" link

API: `GET /subscriptions/my-subscription`, `GET /subscriptions/wallet-history`, `POST /subscriptions/purchase`

### 5.10 Payment — Web Phase

In the web phase (Phase 5), Razorpay is integrated via the hosted checkout opened in a browser tab:

```typescript
import { openBrowserAsync } from 'expo-web-browser';

async function handlePayment(orderId: string) {
  // Backend creates Razorpay order and returns hosted checkout URL
  const { data } = await api.post('/payments/create-order', { orderId });
  // Open Razorpay hosted page in browser
  await openBrowserAsync(data.checkoutUrl);
  // On return: poll /orders/:id for updated payment status
}
```

> **Note:** Full native Razorpay SDK (`react-native-razorpay`) is activated in Phase 6 (Android) using a Platform check so both web and Android are supported from one codebase.

### 5.11 Profile Screen

- Name (editable)
- Mobile number (read-only)
- "My Addresses" → `/address`
- "My Subscription" → `/subscription`
- Help & FAQ (static page)
- Logout

### 5.12 Customer App Testing Checklist

- [ ] OTP login — new user (auto-creates account)
- [ ] OTP login — existing user
- [ ] Add / edit / delete address
- [ ] Set default address
- [ ] View available pickup slots
- [ ] Create order (all 3 steps)
- [ ] Order detail and status timeline
- [ ] Cancel order
- [ ] View subscription plans
- [ ] Purchase subscription (Razorpay web checkout)
- [ ] Wallet balance displayed correctly
- [ ] Pay for an order (Razorpay web checkout)
- [ ] Profile edit + logout
- [ ] Web app loads cleanly at `http://localhost:3004`

---

## PHASE 6: CUSTOMER & DRIVER WEB (NEXT.JS) ✅ COMPLETE

**Status:** ✅ Complete
**Objective:** Build standalone Next.js web platforms for customers (public landing page + portal) and drivers (operational dashboard). Both connect to the same NestJS backend — no new backend modules required.
**Reference:** See `WEBSITE_EXTENSION_PLAN.md` for full architecture details.

### 6.1 Customer Web (`vastra-express-customer-web`) ✅
- **Port:** 3004 (dev)
- **Stack:** Next.js, TypeScript, Tailwind CSS 4, Zustand, Axios, js-cookie
- **Token:** `ve_customer_token` cookie
- **Public landing page** — Hero, Services, Pricing, HowItWorks, WhyUs, Footer
- **Auth:** OTP login (2-step) → `POST /auth/send-otp` + `POST /auth/verify-otp`
- **Portal:** `/portal/dashboard`, `/portal/orders`, `/portal/orders/[id]`, `/portal/book`, `/portal/addresses`, `/portal/profile`
- **Booking wizard** — 3-step (address → slot → service/confirm)
- **Order tracking** — progress bar + status history timeline + bill view + payment
- **Role guard:** CUSTOMER only; non-customers blocked at login

### 6.2 Driver Web (`vastra-express-driver-web`) ✅
- **Port:** 3003 (dev) — _replaces_ Expo web preview port for driver
- **Stack:** Next.js, TypeScript, Tailwind CSS, Zustand, Axios, js-cookie
- **Token:** `ve_driver_token` cookie
- **Auth:** OTP login (2-step)
- **Dashboard:** `/dashboard` — KPI cards + active task list
- **Pickups:** `/dashboard/pickups` + `/dashboard/pickups/[id]` — step-flow (Start → Arrived → Confirm + weight)
- **Deliveries:** `/dashboard/deliveries` + `/dashboard/deliveries/[id]` — step-flow
- **Profile:** `/dashboard/profile`
- **Role guard:** DRIVER only; non-drivers blocked at login

### 6.3 Shared Architecture
- Both apps use **cookie-based JWT** (compatible with Next.js middleware)
- Route protection via `proxy.ts` (middleware layer)
- UI components copied and customised from admin panel pattern
- No backend schema or module changes required
- All features map to existing REST endpoints

---

## PHASE 7: ANDROID APP CONVERSION

**Duration:** Week 7 (Days 36-42)
**Objective:** Convert both web-approved Expo apps to signed Android APKs. Since both apps are already React Native (Expo), this phase adds Android-specific native features and generates production builds — no rewrite required.

### 7.1 EAS Build Setup (Both Apps)

Install EAS CLI:
```bash
npm install -g eas-cli
eas login
```

In each app directory:
```bash
eas build:configure
```

**eas.json (for both apps):**
```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

### 7.2 Android Configuration

**Driver app — app.json additions:**
```json
{
  "expo": {
    "android": {
      "package": "com.vastraexpress.driver",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0066CC"
      },
      "permissions": ["RECEIVE_BOOT_COMPLETED", "VIBRATE", "POST_NOTIFICATIONS"]
    }
  }
}
```

**Customer app — app.json additions:**
```json
{
  "expo": {
    "android": {
      "package": "com.vastraexpress.customer",
      "versionCode": 1,
      "googleServicesFile": "./google-services.json",
      "permissions": ["RECEIVE_BOOT_COMPLETED", "VIBRATE", "POST_NOTIFICATIONS"]
    }
  }
}
```

### 7.3 Firebase Push Notifications (Both Apps)

```bash
npx expo install expo-notifications expo-device
```

**Firebase project setup:**
1. Go to console.firebase.google.com
2. Create project "Vastra Express"
3. Add two Android apps:
   - `com.vastraexpress.driver` — download `google-services.json` → driver app root
   - `com.vastraexpress.customer` — download `google-services.json` → customer app root
4. Enable Cloud Messaging (FCM) in both
5. Copy FCM Server Key → backend `.env` as `FIREBASE_SERVER_KEY`

**Registration & handling:**
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

async function registerForPushNotifications() {
  if (!Device.isDevice) return; // Skip in simulator/web
  
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await api.post('/notifications/token', { token, platform: Platform.OS });
}

// Handle foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

**Triggered events (backend already wired):**
- Pickup scheduled / confirmed
- Picked up by driver
- Received at facility
- Bill generated (customer)
- Out for delivery
- Delivered

### 7.4 Native Razorpay Payment (Customer App)

Replace web checkout with native SDK for Android:

```bash
npm install react-native-razorpay
npx expo install expo-build-properties
```

**Platform-aware payment handler:**
```typescript
import { Platform } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';

async function handlePayment(orderId: string, amount: number) {
  const { data } = await api.post('/payments/create-order', { orderId });

  if (Platform.OS === 'web') {
    // Web: Hosted checkout (Phase 5 approach)
    await openBrowserAsync(data.checkoutUrl);
  } else {
    // Android: Native SDK (Phase 6)
    const RazorpayCheckout = require('react-native-razorpay').default;
    const result = await RazorpayCheckout.open({
      description: `Order #${orderId}`,
      currency: 'INR',
      key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100,
      name: 'Vastra Express',
      order_id: data.razorpayOrderId,
      prefill: { contact: user.mobileNumber, name: user.name },
      theme: { color: '#0066CC' },
    });
    await api.post('/payments/verify', { ...result, orderId });
  }
}
```

### 7.5 Build APKs

**Preview APK (internal testing — direct install):**
```bash
# Driver app
cd vastra-express-driver
eas build --platform android --profile preview

# Customer app
cd vastra-express-customer
eas build --platform android --profile preview
```

**Production AAB (Google Play Store):**
```bash
eas build --platform android --profile production
```

EAS Build runs in the cloud (Expo's build servers). Output is a download link for the `.apk` or `.aab` file.

**Local testing:**
```bash
# Install directly on physical device via USB
adb install path/to/app.apk
```

### 7.6 Android APK Testing Checklist

**Driver App:**
- [ ] OTP login on physical Android device
- [ ] Push notification received on task assignment
- [ ] Pickup task list loads
- [ ] All status transitions work natively
- [ ] Weight entry form works on mobile keyboard
- [ ] Logout clears secure storage

**Customer App:**
- [ ] OTP login / new user registration
- [ ] Push notification received on order status change
- [ ] Order creation — all 3 steps on mobile
- [ ] Razorpay native payment sheet opens
- [ ] Payment verification works
- [ ] Subscription purchase with native Razorpay
- [ ] Address management with mobile keyboard
- [ ] Order tracking status updates in real-time
- [ ] App launch time < 2 seconds
- [ ] Performance on mid-range Android device

---

## PHASE 8: PRODUCTION HARDENING

**Duration:** Week 8 (Days 43-49)  
**Objective:** Prepare all components for production deployment.

### 8.1 Backend Production Setup (Day 43)

#### Environment Configuration
**Source:** SRS V1.md Section 4.3, 4.4

1. **Production .env**
```bash
NODE_ENV=production
PORT=3000

DATABASE_URL="mysql://user:password@localhost:3306/vastra_express_prod"

JWT_SECRET="<secure-random-string>"
JWT_EXPIRATION="7d"

RAZORPAY_KEY_ID="<production-key>"
RAZORPAY_KEY_SECRET="<production-secret>"

FIREBASE_SERVICE_ACCOUNT_PATH="/path/to/service-account.json"

MSG91_AUTH_KEY="<production-key>"
MSG91_TEMPLATE_ID="<template-id>"

ALLOWED_ORIGINS="https://admin.vastraexpress.com,https://facility.vastraexpress.com"
```

2. **Security Hardening**
```bash
npm install helmet
npm install express-rate-limit
npm install cors
```

**Implement:**
- Helmet for security headers
- Rate limiting: 100 req/15min per IP
- CORS with whitelist
- Input sanitization
- SQL injection prevention (Prisma handles)
- XSS protection

3. **Logging**
```bash
npm install winston
npm install winston-daily-rotate-file
```

**Configure:**
- Error logs → file
- Access logs → file
- Rotate daily
- Keep last 14 days

4. **Database**
- Create production database
- Run migrations
- Seed initial data:
  - Admin user
  - Default facility
  - Default city
  - Sample pricing configuration
  - Sample subscription plans

### 8.2 VPS Setup - Hostinger (Day 43)

**Source:** SRS V1.md Section 5

#### Server Specifications
- Ubuntu 22.04 LTS
- Minimum: 2 vCPU, 4GB RAM
- SSD Storage: 50GB+

#### Initial Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL 8.0
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2

# Install certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
```

### 8.3 Backend Deployment (Day 44)

#### Step 1: Upload Code
```bash
# On VPS
mkdir -p /var/www/vastra-express-backend
cd /var/www/vastra-express-backend

# Clone repository or upload files
git clone <repository-url> .

# Install dependencies
npm install --production

# Build TypeScript
npm run build
```

#### Step 2: Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE vastra_express_prod;
CREATE USER 'vastra_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON vastra_express_prod.* TO 'vastra_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Seed data
npm run seed
```

#### Step 3: PM2 Configuration
```bash
# Start application
pm2 start dist/main.js --name vastra-express-api

# Save PM2 process list
pm2 save

# Setup startup script
pm2 startup
```

#### Step 4: Nginx Configuration
```nginx
# /etc/nginx/sites-available/vastra-express-api

server {
    listen 80;
    server_name api.vastraexpress.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vastra-express-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL
sudo certbot --nginx -d api.vastraexpress.com
```

### 8.4 All Web Panels Deployment (Day 44)

#### Step 1: Build Next.js Apps
```bash
# On local machine

# Admin Panel
cd vastra-express-admin
npm run build
npm run export  # Static export

# OR use Node.js server
npm run build
```

#### Step 2: Upload to VPS
```bash
# Static hosting (Nginx)
scp -r out/* user@vps:/var/www/admin.vastraexpress.com/

# OR Node.js hosting (PM2)
scp -r .next package.json user@vps:/var/www/vastra-express-admin/
pm2 start npm --name admin-panel -- start
```

#### Step 3: Nginx for Admin Panel
```nginx
# /etc/nginx/sites-available/admin-panel

server {
    listen 80;
    server_name admin.vastraexpress.com;
    root /var/www/admin.vastraexpress.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # OR for Node.js server
    # location / {
    #     proxy_pass http://localhost:3001;
    # }
}
```

**Repeat for Facility Panel, Customer Web, and Driver Web**

> **Updated (Phase 6 complete):** Deploy all 4 web apps — admin, facility, customer-web, driver-web — each as a separate PM2 process behind Nginx. Domains:
> - `admin.vastraexpress.com` → port 3001
> - `facility.vastraexpress.com` → port 3002
> - `driver.vastraexpress.com` → port 3003
> - `www.vastraexpress.com` → port 3004

### 8.5 Mobile App Production Build (Day 45)

**Source:** SRS V1.md Section 5
**Platform:** Android Only

#### Android Release Build

**Step 1: Generate Signing Key**
```bash
cd VastraExpressApp/android

# Generate keystore file
keytool -genkey -v -keystore vastra-express.keystore -alias vastra-express -keyalg RSA -keysize 2048 -validity 10000

# Follow prompts to set password and details
# Store keystore file and passwords securely
```

**Step 2: Configure Gradle Signing**
```gradle
// android/app/build.gradle

android {
    signingConfigs {
        release {
            storeFile file('vastra-express.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'vastra-express'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Step 3: Build Release APK**
```bash
# Clean previous builds
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Output location:
# android/app/build/outputs/apk/release/app-release.apk
```

**Step 4: Test Release APK**
```bash
# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk

# Test all critical flows
```

### 8.6 Monitoring & Backups (Day 45)

#### Database Backup
```bash
# Create backup script
#!/bin/bash
# /usr/local/bin/backup-db.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/vastra-express"
mkdir -p $BACKUP_DIR

mysqldump -u vastra_user -p'password' vastra_express_prod > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

```bash
# Add to crontab (daily at 2 AM)
0 2 * * * /usr/local/bin/backup-db.sh
```

#### Application Monitoring
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Server monitoring
pm2 install pm2-server-monit
```

#### Server Uptime Monitoring
**Hostinger VPS Built-in Monitoring:**
- Hostinger provides VPS monitoring dashboard
- CPU, RAM, disk usage tracking
- Network traffic monitoring
- Email alerts for critical issues
- Access via Hostinger control panel

**PM2 Process Monitoring:**
```bash
# View real-time monitoring
pm2 monit

# Check process status
pm2 status

# View logs
pm2 logs vastra-express-api --lines 100
```

### 8.7 Documentation (Day 46)

#### Create Documentation Files

1. **API Documentation**
   - Generate Swagger/OpenAPI docs
   - Host at: api.vastraexpress.com/docs
   - Include authentication guide
   - Include sample requests/responses

2. **Deployment Guide**
   - Server setup steps
   - Database setup
   - Environment variables
   - SSL configuration
   - Backup procedures

3. **User Manuals**
   - Admin Panel guide
   - Facility Panel guide
   - Customer App guide (screenshots)

4. **Maintenance Guide**
   - Daily checks
   - Weekly tasks
   - Monthly reviews
   - Troubleshooting common issues

### 8.8 Final Testing (Day 46)

#### Production Checklist

**Backend API**
- [ ] All endpoints working
- [ ] Authentication functional
- [ ] RBAC enforced
- [ ] Database queries optimized
- [ ] Error logging active
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] CORS configured

**Admin Panel**
- [ ] Login working
- [ ] Dashboard loads
- [ ] All CRUD operations functional
- [ ] Reports generating
- [ ] Mobile responsive
- [ ] HTTPS enforced

**Facility Panel**
- [ ] Same as Admin Panel
- [ ] Role restrictions working

**Mobile App**
- [ ] Authentication working
- [ ] Order creation flow
- [ ] Payment integration (test mode)
- [ ] Push notifications
- [ ] Offline handling
- [ ] APK signed & tested

**Integrations**
- [ ] Razorpay (test mode first)
- [ ] Firebase (push notifications)
- [ ] MSG91 (SMS OTP)

**Performance**
- [ ] API response time < 2s
- [ ] Dashboard load time < 3s
- [ ] App launch time < 2s
- [ ] Database queries indexed

**Security**
- [ ] All passwords hashed
- [ ] JWT secrets secure
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] CSRF tokens (if needed)
- [ ] Sensitive data encrypted

**Monitoring**
- [ ] Database backups automated
- [ ] Error logs capturing
- [ ] PM2 monitoring active
- [ ] Uptime alerts configured

---

## ENVIRONMENT SETUP

### Development Environment

**Backend:**
```bash
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/vastra_express_dev"
JWT_SECRET="dev-secret"
RAZORPAY_KEY_ID="<test-key>"
RAZORPAY_KEY_SECRET="<test-secret>"
```

**Frontend:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Mobile:**
```bash
API_URL=http://localhost:3000
RAZORPAY_KEY_ID=<test-key>
```

### Production Environment

**Backend:**
```bash
NODE_ENV=production
DATABASE_URL="mysql://user:pass@localhost:3306/vastra_express_prod"
JWT_SECRET="<strong-random-secret>"
RAZORPAY_KEY_ID="<production-key>"
RAZORPAY_KEY_SECRET="<production-secret>"
```

**Frontend:**
```bash
NEXT_PUBLIC_API_URL=https://api.vastraexpress.com
```

**Mobile:**
```bash
API_URL=https://api.vastraexpress.com
RAZORPAY_KEY_ID=<production-key>
```

---

## DEPLOYMENT STRATEGY

### Phase Deployment

**Phase 1: Backend Deployment**
1. Deploy API to VPS
2. Configure database
3. Test all endpoints
4. Monitor for 24 hours

**Phase 2: Admin Panel**
1. Deploy admin panel
2. Create admin users
3. Test all features
4. Train admin staff

**Phase 3: Facility Panel**
1. Deploy facility panel
2. Create facility users
3. Test order processing
4. Train facility staff

**Phase 4: Driver Web App**
1. Deploy driver web app
2. Approve with stakeholders
3. Fix feedback

**Phase 5: Customer Web App**
1. Deploy customer web app
2. Approve with stakeholders
3. Fix feedback

**Phase 6: Android Conversion**
1. Release to limited users (beta)
2. Gather feedback
3. Fix critical bugs
4. Full public release

---

## CRITICAL SUCCESS FACTORS

### Performance Targets
**Source:** SRS V1.md Section 4.1

- API response time: < 2 seconds
- Support: 100+ daily orders
- Database: Properly indexed
- Caching: Implement for frequently accessed data

### Scalability Requirements
**Source:** SRS V1.md Section 4.3

- Multi-city ready (database schema)
- Multi-facility ready
- Horizontal scaling possible
- Load balancing (future)

### Security Requirements
**Source:** SRS V1.md Section 4.2

- JWT authentication enforced
- RBAC strictly implemented
- HTTPS only
- Payment data encrypted
- PII data protected
- Regular security audits

### Availability
**Source:** SRS V1.md Section 4.4

- 99% uptime target
- Daily database backups
- Auto-restart on crash (PM2)
- Monitoring & alerts

---

## ⚠️ CLARIFICATIONS REQUIRED

Before implementation, please provide:

1. **MSG91 Service**
   - Authentication key (API key)
   - Template ID (after registering templates)
   - SMS templates reviewed and approved by MSG91

2. **Razorpay**
   - ✅ Test keys: Using placeholders for now
   - 📌 **REMINDER:** Obtain actual test keys before Day 5 (Payment Integration)
   - Production keys needed before deployment (Day 28)

3. **Firebase**
   - ✅ Setup will be done during Day 24 (Push Notifications)
   - Android-only configuration
   - Create Firebase project: console.firebase.google.com

4. **Design Assets**
   - App logo (SVG/PNG high-res)
   - App icon (1024x1024px)
   - Splash screen design
   - Color scheme preferences (primary, secondary, accent)
   - Brand guidelines (if any)

5. **Domain & Hosting**
   - Domain names:
     - api.vastraexpress.com
     - admin.vastraexpress.com
     - facility.vastraexpress.com
   - Hostinger VPS login credentials
   - DNS configuration access (for SSL setup)

6. **Business Rules**
   - Initial pricing configuration:
     - Price per kg (Wash & Fold, Dry Clean, Iron Only)
     - Per-item pricing list (shirts, trousers, etc.)
     - Minimum order value (currently ₹500)
     - Express delivery charges
     - Pickup/delivery charges for non-subscribers
   - Subscription plan details:
     - Plan name, description
     - Duration (days)
     - Price
     - Wallet credit amount
     - Benefits
   - Default city & facility information:
     - City name, state
     - Facility name, address, contact
   - Admin user credentials:
     - Name
     - Mobile number
     - Email (optional)

---

## NEXT STEPS

### Immediate Priorities (Phase 7 — Android)
1. **Obtain Firebase project credentials** — download `google-services.json` for both apps
2. **Obtain MSG91 credentials** — Auth Key + Template ID for live SMS OTP
3. **Obtain Razorpay test keys** — replace placeholder credentials in `.env`
4. **EAS Build setup** — `eas login`, `eas build:configure` in both Expo apps
5. **Test Expo apps on physical Android device** before APK build
6. **Build preview APKs** — `eas build --platform android --profile preview` (driver + customer)

### Then (Phase 8 — Production)
7. **Set up Hostinger VPS** — Ubuntu 22.04, Node.js, MySQL, Nginx, PM2, SSL
8. **Deploy backend** — migrate DB, seed data, configure env, PM2 start
9. **Deploy all web panels** — admin, facility, customer-web, driver-web
10. **Build production APKs** — `eas build --platform android --profile production`
11. **Configure monitoring** — PM2 log rotation, DB backup cron, uptime alerts

---

**END OF IMPLEMENTATION GUIDE**

**Note:** This guide is a living document. Last updated March 4, 2026 to reflect Phase 6 completion (Customer Web + Driver Web Next.js apps) and updated phase numbering (Phases 7 & 8 for Android and Production). Any architectural changes must be documented here before implementation. No feature expansion beyond SRS scope without approval.
