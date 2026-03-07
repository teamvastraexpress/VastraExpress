# Vastra Express - Backend API

> Production-grade laundry quick-commerce platform built with NestJS, MySQL, Prisma, and Redis

## 🚀 Project Overview

Vastra Express is a full-stack quick-commerce laundry platform inspired by services like Dunzo and Swiggy Genie. This repository contains the backend REST API built with NestJS, following clean architecture principles and production-grade security practices.

**Project Type:** Quick-commerce laundry service platform  
**Tech Stack:** NestJS 10 | MySQL 8.0 | Prisma 6 | JWT | Redis (coming Day 3)  
**Development Status:** ✅ Day 2 Complete - Authentication Module  

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Development Progress](#-development-progress)
- [Security](#-security)
- [Testing](#-testing)
- [Project Structure](#-project-structure)

---

## ✨ Features

### ✅ Implemented (Day 1-2)
- ✅ Production-grade OTP authentication system
- ✅ JWT-based authorization with role-based access control (RBAC)
- ✅ Secure user registration & login
- ✅ Anti-bruteforce protection (rate limiting, max attempts)
- ✅ SMS integration ready (MSG91)
- ✅ Database schema with 21 tables (full e-commerce flow)
- ✅ Security hardening (Helmet, CORS, input validation)
- ✅ Auto role seeding (CUSTOMER, DRIVER, FACILITY_STAFF, ADMIN)

### 🔜 Coming Soon (Day 3+)
- ⏳ Redis integration for session management
- ⏳ JWT refresh tokens & blacklisting
- ⏳ User profile management
- ⏳ Order creation & tracking
- ⏳ Payment gateway integration (Razorpay)
- ⏳ Real-time notifications (Firebase)
- ⏳ Driver & facility staff modules
- ⏳ Admin dashboard APIs

---

## 🛠️ Tech Stack

### Core Framework
- **NestJS 10** - Progressive Node.js framework
- **TypeScript 5** - Type-safe development
- **MySQL 8.0** - Relational database
- **Prisma 6** - Type-safe ORM

### Authentication & Security
- **JWT** - JSON Web Tokens (@nestjs/jwt, passport-jwt)
- **Helmet** - HTTP security headers
- **Throttler** - Rate limiting
- **class-validator** - Input validation

### Coming Soon
- **Redis** - Session management & caching (Day 3)
- **Bull** - Job queues for background tasks (Day 9)
- **Socket.io** - Real-time updates (Day 11)

### Infrastructure
- **MSG91** - SMS OTP delivery
- **Firebase Admin SDK** - Push notifications
- **Razorpay** - Payment processing

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- MySQL 8.0
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd vastra-express-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env file in root directory
cp .env.example .env
```

Edit `.env` with your values:
```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/vastra_express_dev"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"

# SMS (Optional - falls back to console logs)
MSG91_AUTH_KEY="your-msg91-api-key"

# App
NODE_ENV="development"
PORT=3000
```

4. **Set up the database**
```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

5. **Start the development server**
```bash
npm run start:dev
```

The server will start at `http://localhost:3000/api`

---

## 📚 API Documentation

### Quick Test
Run the automated test script:
```powershell
.\test-api.ps1
```

### Manual Testing
See [API_TESTING.md](./API_TESTING.md) for complete endpoint documentation with examples.

### Available Endpoints (Day 2)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api` | ❌ | Health check |
| POST | `/api/auth/send-otp` | ❌ | Send OTP to mobile |
| POST | `/api/auth/verify-otp` | ❌ | Verify OTP & login/register |
| GET | `/api/auth/profile` | ✅ | Get current user profile |
| POST | `/api/auth/logout` | ✅ | Logout (placeholder) |

### Example: Complete Auth Flow
```powershell
# 1. Send OTP
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/send-otp" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"mobile":"9876543210"}'

# 2. Check server logs for OTP, then verify
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/verify-otp" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"mobile":"9876543210","otp":"123456","name":"Test User"}'

# 3. Use returned JWT token
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/profile" `
  -Method GET `
  -Headers @{"Authorization"="Bearer YOUR_JWT_TOKEN"}
```

---

## 📊 Development Progress

Following the [IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md) 50-day plan:

### ✅ Day 1 - Project Setup (Complete)
- ✅ NestJS project initialization
- ✅ MySQL 8.0 installation
- ✅ Database creation
- ✅ Prisma schema design (21 tables)
- ✅ Initial migrations

### ✅ Day 2 - Authentication Module (Complete)
- ✅ OTP system with SMS integration
- ✅ JWT authentication
- ✅ Role-based access control (RBAC)
- ✅ Security hardening (Helmet, rate limiting)
- ✅ Input validation
- ✅ Auto-registration flow

### 🔜 Day 3 - Redis Integration (Next)
- ⏳ Redis installation & configuration
- ⏳ Session management
- ⏳ JWT refresh tokens
- ⏳ Token blacklisting
- ⏳ Caching layer

**See [DAY_2_REPORT.md](./DAY_2_REPORT.md) for complete Day 2 implementation details.**

---

## 🔒 Security

### Production-Grade Security Features

#### Authentication & Authorization
- ✅ Cryptographically secure OTP generation (crypto.randomInt)
- ✅ JWT with HS256 algorithm
- ✅ Password-less authentication (OTP-based)
- ✅ Role-based access control (4 roles)
- ✅ User validation on every protected request

#### API Protection
- ✅ **Rate Limiting:**
  - Global: 100 requests per 15 minutes
  - Send OTP: 3 requests per minute
  - Verify OTP: 5 requests per minute
- ✅ **Anti-Bruteforce:**
  - Max 3 OTP verification attempts
  - 1-minute cooldown between OTP requests
  - Auto-deletion after max attempts
- ✅ **Input Validation:**
  - Mobile: Indian format regex `^[6-9][0-9]{9}$`
  - OTP: Exactly 6 digits
  - Name: 2-50 characters
  - Request body whitelisting

#### Security Headers (Helmet)
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `Strict-Transport-Security: max-age=31536000`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ Content Security Policy

#### Database Security
- ✅ Parameterized queries (Prisma prevents SQL injection)
- ✅ Unique constraints (mobile number)
- ✅ Foreign key integrity
- ✅ Connection pooling

---

## 🧪 Testing

### Manual Testing
```powershell
# Run the automated test suite
.\test-api.ps1
```

### Unit Tests (Coming Day 8)
```bash
npm run test
```

### E2E Tests (Coming Day 8)
```bash
npm run test:e2e
```

### Test Coverage (Coming Day 8)
```bash
npm run test:cov
```

---

## 📁 Project Structure

```
vastra-express-backend/
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── dto/               # Data transfer objects
│   │   ├── strategies/        # Passport strategies (JWT)
│   │   ├── guards/            # Auth & role guards
│   │   ├── decorators/        # Custom decorators
│   │   ├── auth.service.ts    # Business logic
│   │   ├── auth.controller.ts # API endpoints
│   │   └── auth.module.ts     # Module configuration
│   ├── prisma/                # Database service
│   │   └── prisma.service.ts  # Prisma client wrapper
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application bootstrap
├── prisma/
│   ├── schema.prisma          # Database schema (21 tables)
│   └── migrations/            # Database migrations
├── .env                       # Environment variables (create from .env.example)
├── API_TESTING.md            # Complete API documentation
├── DAY_2_REPORT.md           # Day 2 implementation report
├── test-api.ps1              # Automated test script
└── README.md                 # This file
```

---

## 📖 Documentation

- **[IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md)** - 50-day development roadmap
- **[API_TESTING.md](./API_TESTING.md)** - Complete API testing guide
- **[DAY_2_REPORT.md](./DAY_2_REPORT.md)** - Day 2 completion report
- **[SRS V1.md](../SRS V1.md)** - Software Requirements Specification

---

## 🤝 Contributing

This is a structured implementation project following a strict 50-day plan. Contributions should align with the IMPLEMENTATION_GUIDE.md schedule.

---

## 📝 License

[MIT License](LICENSE)

---

## 🙏 Acknowledgments

- NestJS framework
- Prisma ORM
- MySQL
- Passport.js

---

## 📧 Support

For issues or questions:
1. Check [API_TESTING.md](./API_TESTING.md) for common problems
2. Review [DAY_2_REPORT.md](./DAY_2_REPORT.md) for troubleshooting
3. Refer to [IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md) for architecture decisions

---

**Built with ❤️ using NestJS, MySQL, Prisma | Production-ready architecture**

$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
