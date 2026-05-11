# 🧺 Vastra Express - Premium Laundry Logistics

![Monorepo](https://img.shields.io/badge/Monorepo-Yes-1f6feb)
![Backend](https://img.shields.io/badge/Backend-NestJS-e0234e)
![Web](https://img.shields.io/badge/Web-Next.js-111111)
![Mobile](https://img.shields.io/badge/Mobile-Expo-4630EB)
![Database](https://img.shields.io/badge/Database-MySQL-00758F)
![Status](https://img.shields.io/badge/Version-V2-success)

Vastra Express is a high-performance laundry logistics and fulfillment platform. It manages the entire lifecycle of laundry operations—from customer booking and driver pickups to facility processing and final delivery.

---

## 🚀 Overview

The platform is designed as a monorepo consisting of multiple specialized applications tailored for different operational roles:

*   **Admin Dashboard:** Centralized control for managing users, facilities, and global operations.
*   **Facility Management:** Streamlined workflow for laundry processing (Sorting, Washing, Packing).
*   **Driver Portal:** Mobile-first interface for pickup and delivery fulfillment.
*   **Customer Experience:** Premium web and mobile apps for booking and real-time tracking.

---

## 🛠 Tech Stack

### Core Technologies
*   **Backend:** [NestJS](https://nestjs.com/) (REST API)
*   **Database:** [MySQL](https://www.mysql.com/) with [Prisma ORM](https://www.prisma.io/)
*   **Frontend:** [Next.js](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/)
*   **Mobile:** [Expo](https://expo.dev/) / [React Native](https://reactnative.dev/)
*   **State Management:** [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

## 📂 Project Structure

| Directory | Type | Purpose | Port |
| :--- | :--- | :--- | :--- |
| `vastra-express-backend` | API | Core NestJS REST API & Database | `3000` |
| `vastra-express-admin` | Web | Admin Operations Dashboard | `3001` |
| `vastra-express-facility` | Web | Facility Processing Interface | `3002` |
| `vastra-express-driver-web` | Web | Driver Management & Status | `3003` |
| `vastra-express-customer-web` | Web | Customer Booking Portal (Web) | `3004` |
| `vastra-express-customer` | Mobile | Customer Experience (Expo App) | - |
| `vastra-express-driver` | Mobile | Driver Fulfillment (Expo App) | - |

---

## 🏁 Getting Started

Follow these steps to set up the project on your local machine.

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [MySQL Server](https://dev.mysql.com/downloads/installer/)
*   [Expo Go](https://expo.dev/client) (optional, for mobile testing)

### 2. Environment Configuration
Create a `.env` file in the `vastra-express-backend` directory:
```env
DATABASE_URL="mysql://user:password@localhost:3306/vastra_express"
JWT_SECRET="your_secret_key"
PORT=3000
```

### 3. Database Initialization
Navigate to the backend directory and set up the database:
```bash
cd vastra-express-backend
npm install
npx prisma generate
npx prisma migrate dev
```

### 4. Running the Project

#### **Option A: Automated Startup (Windows)**
Run the included PowerShell script to start the backend and all web services in separate windows:
```powershell
./start-all.ps1
```

#### **Option B: Manual Startup**
Start the **Backend** (Required for all apps):
```bash
cd vastra-express-backend
npm run start:dev
```

Start the **Customer Mobile App**:
```bash
cd vastra-express-customer
npm install
npx expo start --web # Or press 'a' for Android / 'i' for iOS
```

Start any **Web App** (e.g., Customer Web):
```bash
cd vastra-express-customer-web
npm install
npm run dev
```

---

## 🔑 Test Credentials

| Role | Username/Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `password` |
| **Customer** | `jim@gmail.com` | `password123` |

---

## 📖 Documentation

*   [V2 Migration Guide](./V2_MIGRATION_GUIDE.md) - Details on removed/active modules.
*   [Implementation Plan](./IMPLEMENTATION_GUIDE.md) - Architectural overview.
*   [Firebase Setup](./FIREBASE_SETUP_GUIDE.md) - Notification configuration.

---

## 🛡 Security Note
Secrets and environment files are excluded via `.gitignore`. Always use `.env.example` as a template for new environments.
