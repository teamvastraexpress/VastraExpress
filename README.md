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
*   **Facility Management:** Streamlined workflow for laundry processing.
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
Create a `.env` file in the `vastra-express-backend` directory (use `.env.example` as a template):
```env
DATABASE_URL="mysql://user:password@localhost:3306/vastra_express"
JWT_SECRET="your_secret_key"
PORT=3000
```

### 3. Automated Startup (Recommended)
Run the included PowerShell script to clear ports, start the backend, and launch all web services in separate windows:
```powershell
./start-all.ps1
```

### 4. Manual Startup (Step-by-Step)

#### **Step A: Clear Port Conflicts**
If the app was previously running or crashed, clear the ports to avoid `EADDRINUSE` errors:
```powershell
# Run in PowerShell to clear port 3000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

#### **Step B: Start the Backend (The Engine)**
The backend must be running for any of the apps to function.
```bash
cd vastra-express-backend
npm install
npx prisma generate
npm run start:dev
```
*Wait until you see: `[Bootstrap] 🚀 Application is running on: http://localhost:3000/api`*

#### **Step C: Start the Customer App**
```bash
cd vastra-express-customer
npm install
npx expo start --web --port 3004
```
*The app will be accessible at `http://localhost:3004`.*


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
