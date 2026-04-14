# Vastra Express Beta Client Handover Document

Document Version: 1.0  
Prepared Date: 14 April 2026  
Release Stage: Beta (Web)

## 1. Purpose

This document provides the client handover package for Beta testing of Vastra Express web applications.

This handover intentionally excludes all sensitive information, including:
- database credentials
- API keys and service secrets
- JWT secrets
- privileged user passwords
- internal infrastructure access credentials

## 2. Live Environment Summary

### 2.1 Frontend Applications (Vercel)

- Admin: https://vastra-express-admin.vercel.app/
- Facility: https://vastra-express-facility.vercel.app/
- Customer Web: https://vastra-express-customer.vercel.app/
- Driver Web: https://vastra-express-driver.vercel.app/

### 2.2 Backend API (Railway)

- Backend Host: https://vastra-xpress-production.up.railway.app/
- API Base URL for clients: https://vastra-xpress-production.up.railway.app/api

Important:
- A GET call to root URL (/) returns 404 by design.
- This is expected because API routes are served under /api.
- Quick verification endpoint: GET /api returns Hello World!.

### 2.3 Database and Hosting

- Database Host: Hostinger (MySQL)
- Backend Hosting: Railway
- Frontend Hosting: Vercel

## 3. Beta Scope and Business Modules

### 3.1 In-Scope for Beta Testing

- Authentication and role-based access control
- Orders and order lifecycle tracking
- Pickup slot management
- Driver assignment and delivery operations
- Facility processing workflows
- Inventory and reporting dashboards

### 3.2 V2 Product Direction

Current V2 scope is operations-first.
Billing, payment, and subscription purchasing flows are removed from active user testing scope in this beta.

## 4. User Roles and Portal Mapping

- Admin
  - user/facility/staff management
  - slot governance
  - order oversight and reporting

- Facility Staff
  - order processing
  - status progression
  - slot operations
  - local inventory and delivery handoff visibility

- Driver
  - pickup tasks
  - delivery tasks
  - assignment execution

- Customer
  - order placement
  - order tracking
  - profile/address management (as exposed in current build)

## 5. Core Operational Flow (Beta)

Typical order progression:

ORDER_CREATED
-> ORDER_CONFIRMED
-> PICKUP_SCHEDULED
-> PICKUP_ASSIGNED
-> OUT_FOR_PICKUP
-> PICKUP_ARRIVED
-> PICKED_UP
-> RECEIVED_AT_FACILITY
-> SORTING
-> WASHING
-> READY_FOR_DISPATCH
-> DELIVERY_ASSIGNED
-> OUT_FOR_DELIVERY
-> DELIVERY_ARRIVED
-> DELIVERED

Note:
- legacy intermediary statuses may appear in historical records based on older data.

## 6. Verified Tech Stack and Versions

### 6.1 Backend

- Node.js: 20 LTS (recommended runtime)
- NestJS: 11.0.1
- Prisma ORM: 6.19.2
- MySQL: 8.x
- Auth/Security: JWT, Passport, Helmet, Throttler, class-validator

### 6.2 Web Applications

- Next.js: 16.1.6
- React: 19.2.3
- TypeScript: 5.x
- State Management: Zustand
- Styling: Tailwind CSS 4
- Charts: Recharts (Admin and Facility reporting views)

### 6.3 Mobile Codebase (Not part of this web beta handover)

- Expo SDK: 55
- React Native: 0.83.2

## 7. Current Known Constraints and Expected Behavior

### 7.1 Backend Root Path Behavior

- Error response on backend root (Cannot GET /) is expected.
- Use /api path for all API interactions.

### 7.2 MSG91 SMS Service Status

- MSG91 is currently not configured in production.
- OTP-based SMS authentication flows are therefore not production-ready for external user testing.
- This directly affects customer and driver OTP login journeys unless SMS service is configured.

### 7.3 API Documentation Access

- Swagger is disabled in production by design (security hardening).

## 8. UAT Prerequisites for Client

Before UAT begins, ensure the following are provided through secure channels:

- test user accounts per role (Admin, Facility Staff, Driver, Customer)
- role-wise test scenarios and expected outcomes
- any temporary OTP handling process (until MSG91 is enabled)
- support escalation contact list and response SLA

Recommended test setup:

- Latest Chrome or Edge browser
- Stable internet connection
- Access to all Vercel URLs listed in this document
- API reachability check on /api endpoint

## 9. Suggested UAT Checklist (Client-Friendly)

### 9.1 Admin

- Login and session persistence
- View dashboard metrics
- Manage users and roles
- Monitor order statuses and transitions
- Verify slot and assignment controls

### 9.2 Facility

- Login and facility-scoped access
- View and process assigned orders
- Update processing statuses
- Manage pickup slots
- Validate reports and summaries

### 9.3 Driver Web

- Login flow
- View pickup and delivery tasks
- Update assignment progress
- Complete and fail task paths

### 9.4 Customer Web

- Login and onboarding flow
- Create order
- Track order progress
- Verify address/profile interactions

## 10. Upcoming Services and Next Phase Items

Planned next-phase work after beta stabilization:

- MSG91 production setup and template enablement
- Push notification readiness (Firebase service account and templates)
- Mobile deployment preparation (APK/TestFlight pipeline)
- Additional production hardening and observability improvements
- UAT feedback-driven UX and workflow refinements

## 11. Security and Data Handling Notes

- No secrets are included in this document.
- Credentials must be shared separately via secure channel only.
- Beta should use non-sensitive test data.
- Production personally identifiable data must not be used in unrestricted UAT environments.

## 12. Handover Items Shared in This Package

- Live application URLs
- Backend API base URL and route behavior clarification
- Product scope and role-based testing map
- Tech stack and version summary
- Known limitations and dependencies
- UAT checklist and next-step roadmap

## 13. Formal Sign-Off Template

Client Name: _____________________  
Authorized Signatory: _____________________  
Date: _____________________  

Vendor Representative: _____________________  
Date: _____________________
