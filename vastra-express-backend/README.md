# Vastra Express - Backend API

> Production-grade laundry quick-commerce platform built with NestJS, MySQL, and Prisma.

## 🚀 Project Overview

Vastra Express is a full-stack quick-commerce laundry platform. This repository contains the backend REST API built with NestJS.

**Tech Stack:** NestJS | MySQL | Prisma | JWT | Email OTP

---

## ✨ Features

- ✅ **Standardized Authentication**: Email + Password based login for all users.
- ✅ **Email OTP Verification**: Registration verified via OTP sent to email (Indiegram API).
- ✅ **Role-Based Access Control (RBAC)**: CUSTOMER, DRIVER, FACILITY_STAFF, ADMIN.
- ✅ **Security**: JWT tokens, bcrypt password hashing, rate limiting, and Helmet headers.
- ✅ **Database**: MySQL with Prisma ORM (21 tables).

---

## 🛠️ Getting Started

### Installation

1. **Clone and Install**
```bash
git clone <repository-url>
cd vastra-express-backend
npm install
```

2. **Environment Setup**
Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL`: Your MySQL connection string.
- `JWT_SECRET`: Secure 64-character hex string.
- `EMAIL_OTP_AUTH_TOKEN`: Indiegram API token.

3. **Database Setup**
```bash
npx prisma migrate deploy
npx prisma generate
```

4. **Start**
```bash
npm run start:dev
```

---

## 🔒 Security

- **Authentication**: JWT-based (7d expiry).
- **Passwords**: Hashed using bcrypt (10 rounds).
- **Rate Limiting**: ThrottlerGuard applied globally.
- **OTP**: 6-digit codes with 5-minute expiry and max 3 attempts.

---

## 📁 Project Structure

- `src/auth/`: Standard login and email-based registration logic.
- `src/notifications/`: System logging and internal notification logic.
- `src/prisma/`: Database service wrapper.
- `prisma/schema.prisma`: Database schema definition.

---

**Built for Vastra Express | Clean Architecture & Production-ready**
