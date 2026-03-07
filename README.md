<div align="center">

# 🧺 Vastra Xpress

### *On-demand laundry & dry cleaning, delivered fast*

A full-stack quick-commerce laundry platform — built with **NestJS**, **Next.js**, **Expo React Native**, **Prisma**, and **MySQL**.

[![GitHub repo](https://img.shields.io/badge/GitHub-Vastra--Xpress-181717?style=for-the-badge&logo=github)](https://github.com/tanmayk15/Vastra-Xpress)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Expo](https://img.shields.io/badge/Expo-55-000020?style=for-the-badge&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)](https://mysql.com)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Applications](#-applications)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Running the Project](#-running-the-project)
- [API Overview](#-api-overview)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Features](#-features)

---

## 🌟 Overview

**Vastra Xpress** is a production-grade quick-commerce laundry platform inspired by services like Dunzo and Swiggy Genie. Customers can schedule laundry pickups, track orders in real-time, and receive clean clothes at their doorstep.

The platform consists of **7 interconnected applications** sharing a single REST API backend:

| Role | Platform | URL |
|------|----------|-----|
| 🛒 **Customer** | Mobile App (iOS/Android) | Expo React Native |
| 🌐 **Customer** | Web Portal | `http://localhost:3004` |
| 🚗 **Driver** | Mobile App (iOS/Android) | Expo React Native |
| 🌐 **Driver** | Web Portal | `http://localhost:3003` |
| 🏭 **Facility Staff** | Web Dashboard | `http://localhost:3002` |
| 👑 **Admin** | Web Dashboard | `http://localhost:3001` |
| ⚙️ **Backend API** | REST API + Swagger | `http://localhost:3000/api` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│                                                         │
│  📱 Customer App    📱 Driver App                       │
│  (Expo RN)         (Expo RN)                            │
│                                                         │
│  🌐 Customer Web   🌐 Driver Web   🏭 Facility   👑 Admin │
│  (Next.js :3004)  (Next.js :3003) (Next.js :3002) (:3001)│
└────────────────────┬────────────────────────────────────┘
                     │  REST API (JWT Auth)
┌────────────────────▼────────────────────────────────────┐
│                   BACKEND API                           │
│         NestJS 11 + Swagger  :3000/api                  │
│                                                         │
│  Auth │ Orders │ Payments │ Delivery │ Inventory        │
│  Billing │ Reports │ Notifications │ Subscriptions      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  DATA LAYER                             │
│   MySQL 8.0  ←→  Prisma ORM  │  Redis (cache/sessions) │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Applications

### ⚙️ `vastra-express-backend`
- **Framework:** NestJS 11 + TypeScript
- **Port:** `3000`
- **Description:** Central REST API powering all clients. Handles authentication, orders, payments, delivery management, billing, reports, and real-time notifications.
- **Key modules:** Auth, Orders, Payments (Razorpay), Delivery, Inventory, Billing, Subscriptions, Reports, Notifications (FCM/SMS), Pickup Slots, Facilities, Users

### 👑 `vastra-express-admin`
- **Framework:** Next.js 16 + Tailwind CSS
- **Port:** `3001`
- **Description:** Internal admin dashboard for business operators to manage orders, users, payments, reports, inventory, and delivery assignments.

### 🏭 `vastra-express-facility`
- **Framework:** Next.js 16 + Tailwind CSS
- **Port:** `3002`
- **Description:** Facility staff portal for managing laundry pipeline — receiving, processing, washing, and dispatching orders.

### 🚗 `vastra-express-driver-web`
- **Framework:** Next.js 16 + Tailwind CSS
- **Port:** `3003`
- **Description:** Web portal for delivery drivers to manage pickup and delivery assignments.

### 🌐 `vastra-express-customer-web`
- **Framework:** Next.js 16 + Tailwind CSS
- **Port:** `3004`
- **Description:** Customer-facing web portal for booking orders, tracking laundry, managing addresses, subscriptions, and payments.

### 📱 `vastra-express-customer`
- **Framework:** Expo (React Native) + NativeWind
- **Description:** Native mobile app (iOS & Android) for customers to book, track, and manage their laundry orders.

### 📱 `vastra-express-driver`
- **Framework:** Expo (React Native) + NativeWind
- **Description:** Native mobile app (iOS & Android) for drivers to accept and manage pickup/delivery tasks with real-time updates.

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 11 | API framework |
| **TypeScript** | 5 | Type safety |
| **Prisma** | 6 | ORM |
| **MySQL** | 8.0 | Database |
| **JWT + Passport** | — | Authentication |
| **Razorpay** | — | Payments |
| **Firebase Admin** | — | Push notifications |
| **MSG91** | — | SMS OTP |
| **Helmet** | — | Security headers |
| **Swagger** | — | API docs |

### Web Apps (Admin / Facility / Customer / Driver)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 | React framework |
| **Tailwind CSS** | 4 | Styling |
| **Zustand** | 5 | State management |
| **Axios** | — | HTTP client |
| **React Hook Form** | — | Form management |
| **Recharts** | — | Data visualization |
| **Lucide React** | — | Icons |

### Mobile Apps (Customer / Driver)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo** | 55 | React Native framework |
| **React Native** | 0.83 | Mobile UI |
| **NativeWind** | 4 | Tailwind for mobile |
| **Expo Router** | 4 | File-based navigation |
| **Zustand** | 5 | State management |
| **Expo Secure Store** | — | Token storage |

---

## 📋 Prerequisites

Make sure you have the following installed:

- **Node.js** >= 18.x → [nodejs.org](https://nodejs.org)
- **npm** >= 9.x
- **MySQL** 8.0 → [mysql.com](https://mysql.com)
- **Git** → [git-scm.com](https://git-scm.com)
- **Expo CLI** (for mobile apps) → `npm install -g expo-cli`

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/tanmayk15/Vastra-Xpress.git
cd Vastra-Xpress
```

### 2. Set up the Backend

```bash
cd vastra-express-backend

# Install dependencies
npm install

# Copy environment file and fill in your values
cp .env.example .env
```

Edit `.env` with your database credentials and API keys (see [Environment Variables](#-environment-variables) section).

```bash
# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start the backend dev server
npm run start:dev
```

API will be live at → **http://localhost:3000/api**
Swagger docs at → **http://localhost:3000/api/docs**

### 3. Set up Web Apps

Each web app follows the same pattern:

```bash
# Admin Dashboard
cd vastra-express-admin
npm install
npm run dev        # → http://localhost:3001

# Facility Portal
cd vastra-express-facility
npm install
npm run dev        # → http://localhost:3002

# Driver Web
cd vastra-express-driver-web
npm install
npm run dev        # → http://localhost:3003

# Customer Web
cd vastra-express-customer-web
npm install
npm run dev        # → http://localhost:3004
```

### 4. Set up Mobile Apps

```bash
# Customer Mobile App
cd vastra-express-customer
npm install
npx expo start

# Driver Mobile App
cd vastra-express-driver
npm install
npx expo start
```

---

## ▶️ Running the Project

### One-Command Launch (Windows)

A PowerShell script is provided to launch all web servers at once:

```powershell
.\start-all.ps1
```

This opens separate terminal windows for each server:

```
✅ Backend      → http://localhost:3000/api
✅ Admin        → http://localhost:3001
✅ Facility     → http://localhost:3002
✅ Driver Web   → http://localhost:3003
✅ Customer Web → http://localhost:3004
```

---

## 📡 API Overview

The backend exposes a RESTful API with JWT authentication and role-based access control.

### Authentication
All protected routes require a `Bearer` JWT token in the `Authorization` header.

### User Roles
| Role | Description |
|------|-------------|
| `CUSTOMER` | End users who book laundry services |
| `DRIVER` | Delivery & pickup personnel |
| `FACILITY_STAFF` | Laundry facility workers |
| `ADMIN` | Platform administrators |

### Key Endpoint Groups

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | OTP login, JWT tokens, profile |
| Orders | `/api/orders` | Create, track, update orders |
| Pickup Slots | `/api/pickup-slots` | Available time slots |
| Delivery | `/api/delivery` | Assignment & tracking |
| Payments | `/api/payments` | Razorpay integration |
| Billing | `/api/billing` | Invoices & pricing |
| Inventory | `/api/inventory` | Stock management |
| Subscriptions | `/api/subscriptions` | Subscription plans |
| Reports | `/api/reports` | Analytics & exports |
| Notifications | `/api/notifications` | Push & SMS alerts |
| Facilities | `/api/facilities` | Facility management |
| Users | `/api/users` | User profiles |
| Addresses | `/api/addresses` | Saved addresses |

Full interactive API docs available via Swagger at: **http://localhost:3000/api/docs**

---

## 🗄️ Database Schema

Built on **MySQL 8.0** with **Prisma ORM**. The schema covers the full e-commerce flow:

```
Core Models:
├── Role              — User roles (CUSTOMER, DRIVER, FACILITY_STAFF, ADMIN)
├── User              — All platform users
├── Address           — Customer saved addresses
├── OtpVerification   — OTP-based authentication

Order Flow:
├── Order             — Main order entity
├── OrderItem         — Garment-level line items
├── OrderStatusHistory — Full audit trail
├── PickupSlot        — Available time windows
├── DeliveryAssignment — Driver task assignments

Commerce:
├── ServiceType       — Wash, dry clean, iron, etc.
├── PricingRule       — Dynamic pricing per service
├── Subscription      — Monthly/weekly plans
├── Payment           — Razorpay transactions
├── Bill              — Generated invoices

Operations:
├── Facility          — Laundry facility details
├── Inventory         — Supplies tracking
├── Review            — Customer ratings
├── Notification      — Push/SMS log
```

---

## 🔧 Environment Variables

### Backend (`.env`)

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/vastra_express_dev"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# App
NODE_ENV="development"
PORT=3000

# SMS - MSG91 (Optional — falls back to console logs in dev)
MSG91_AUTH_KEY="your-msg91-api-key"
MSG91_TEMPLATE_ID="your-template-id"
MSG91_SENDER_ID="VASTRA"

# Payments - Razorpay
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"

# Push Notifications - Firebase
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
```

### Web Apps (`.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

> ⚠️ **Never commit `.env` files.** They are gitignored. Use `.env.example` as the template.

---

## 📁 Project Structure

```
Vastra-Xpress/
│
├── 📄 README.md                        ← You are here
├── 📄 start-all.ps1                    ← Launch all servers (Windows)
├── 📄 .gitignore                       ← Root gitignore
├── 📄 .gitattributes                   ← Line ending rules
│
├── ⚙️  vastra-express-backend/          ← NestJS REST API
│   ├── src/
│   │   ├── auth/                       ← OTP auth, JWT, RBAC
│   │   ├── orders/                     ← Order lifecycle management
│   │   ├── payments/                   ← Razorpay integration
│   │   ├── delivery/                   ← Driver assignment
│   │   ├── billing/                    ← Pricing & invoices
│   │   ├── inventory/                  ← Stock management
│   │   ├── subscriptions/              ← Plans & renewals
│   │   ├── notifications/              ← FCM + SMS
│   │   ├── reports/                    ← Analytics
│   │   ├── facilities/                 ← Facility ops
│   │   ├── pickup-slots/               ← Time slot management
│   │   ├── users/                      ← User profiles
│   │   └── addresses/                  ← Saved locations
│   └── prisma/
│       ├── schema.prisma               ← DB schema (21 models)
│       └── migrations/                 ← Migration history
│
├── 👑  vastra-express-admin/            ← Admin dashboard (Next.js :3001)
│
├── 🏭  vastra-express-facility/         ← Facility portal (Next.js :3002)
│
├── 🚗  vastra-express-driver-web/       ← Driver web (Next.js :3003)
│
├── 🌐  vastra-express-customer-web/     ← Customer web (Next.js :3004)
│
├── 📱  vastra-express-customer/         ← Customer mobile (Expo)
│
└── 📱  vastra-express-driver/           ← Driver mobile (Expo)
```

---

## ✨ Features

### 🔐 Authentication & Security
- Passwordless OTP-based login (SMS via MSG91)
- JWT tokens with role-based access control (4 roles)
- Rate limiting & anti-brute force protection
- Security headers via Helmet

### 🛒 Customer Features
- Browse & book laundry services (wash, dry clean, iron, fold)
- Schedule flexible pickup time slots
- Real-time order tracking
- Multiple saved addresses
- Subscription plans (weekly/monthly)
- Order history & invoices
- Razorpay payment integration

### 🚗 Driver Features
- Accept/reject pickup & delivery tasks
- GPS-based task management
- Order status updates on the go
- Delivery history & earnings

### 🏭 Facility Features
- Laundry pipeline management (received → processing → ready → dispatched)
- Garment-level order tracking
- Inventory & supplies management
- Staff shift & slot management

### 👑 Admin Features
- Full platform analytics & reports
- User management (customers, drivers, staff)
- Order monitoring & override
- Billing & payment management
- Pricing rule configuration
- Facility & slot management

---

<div align="center">

**Built with ❤️ using NestJS · Next.js · Expo · Prisma · MySQL**

</div>
