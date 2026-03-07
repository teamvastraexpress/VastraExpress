Vastra Express
Quick-Commerce Laundry Platform
Version 1.0 – Initial Production Specification

1️⃣ PROJECT OVERVIEW
Project Name

Vastra Express

Project Type

On-demand + Scheduled Laundry Quick-Commerce Platform

Vision

To build a scalable, city-based quick-commerce laundry system that manages:

Customer booking

Pickup logistics

Processing workflow

Billing automation

Delivery management

Subscription-based laundry plans

The system should be built scalable from Day 1 to support:

Multi-city expansion

Multiple processing facilities

Large driver fleets

Subscription-based recurring customers

2️⃣ BUSINESS MODEL
Operating Model

Central processing facility per city

In-house pickup & delivery fleet

Weight-based + item-based billing

Optional subscription plans

Revenue Streams

Per order laundry charges

Subscription plans

Express delivery surcharge

Add-on services (future scope)

3️⃣ PLATFORM ARCHITECTURE (ROLE-BASED)
Role	Platform
Customer	Mobile App (React Native)
Delivery Partner	Mobile App
Facility Staff	Web Panel
Admin	Web Panel
System	Backend Automation

4️⃣ ROLE DEFINITIONS & PERMISSIONS
🟦 1. Customer (Mobile App)
Authentication

Register via mobile number

Login via OTP

JWT-based session

Logout

Profile

Update profile

Manage multiple addresses

Set default address

Orders

Book pickup

Select pickup date & slot

Add cloth notes

Track order in real-time

View estimated delivery

View final bill

Download invoice

Subscription

Purchase plan

View usage

Pause / Resume

View expiry

Payment

UPI / Card / Wallet

COD

View payment history

🟦 2. Delivery Partner (Mobile)
Authentication

Admin-created account

Secure login

Pickup

View assigned pickups

Confirm arrival

Record weight

Add notes

Mark picked up

Delivery

View assigned deliveries

Confirm arrival

Collect COD

Mark delivered

Cannot:

Modify pricing

Access admin data

Access other orders

🟦 3. Facility Staff (Web)
Order Handling

View incoming orders

Access cloth details

Processing Workflow

Update:

Sorting

Washing

Ironing

Packing

QR tagging

Billing

Enter final weight

Generate final bill

Forward to dispatch

Issues

Report damage

Add internal notes

🟦 4. Admin (Web Panel)
Dashboard

View all orders

Modify status (override)

Staff Management

Add / remove staff

Assign roles

Manage delivery partners

Subscription Management

Create plans

Modify limits

Activate / deactivate

Reports

Revenue

Daily orders

Delivery performance

Subscription stats

Customer Support

View customer details

Handle complaints

Issue refunds

5️⃣ ORDER LIFECYCLE (FINALIZED)
Main Flow
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

Alternate States

CANCELLED

PICKUP_FAILED

PROCESSING_ISSUE

DELIVERY_FAILED

REFUND_INITIATED

6️⃣ SYSTEM RULES

Only backend can change order status

Strict state transition validation

Maintain order status history table

Role-based access enforced via middleware

All actions logged

7️⃣ TECH STACK (FINALIZED)
Frontend (Web Panel)

Next.js (Latest LTS)

TypeScript

Tailwind CSS

Axios

JWT Authentication

Mobile App

React Native

TypeScript

Redux Toolkit / Zustand

Firebase Cloud Messaging (Push)

Backend

Node.js (LTS)

Express.js

TypeScript

JWT Authentication

REST Architecture

Database

MySQL 8+

Indexed queries

Foreign key constraints

Notifications

Firebase Cloud Messaging (Push)

MSG91 (SMS OTP)

Hosting

Hostinger VPS

Nginx

PM2

SSL via Let’s Encrypt

8️⃣ DATABASE CORE ENTITIES

users

roles

permissions

addresses

orders

order_status_history

order_items

subscriptions

subscription_usage

payments

delivery_assignments

facilities

reports (derived)

9️⃣ SECURITY MODEL

Full RBAC

JWT authentication

Rate limiting

Input validation

Encrypted passwords (bcrypt)

HTTPS only

API throttling

Role middleware validation

🔟 NON-FUNCTIONAL REQUIREMENTS

Scalable to multi-city

Modular backend architecture

Clean folder structure

API versioning

99% uptime target

Optimized queries

Logging & monitoring ready

1️⃣1️⃣ FUTURE SCALABILITY

Multi-city support

Multiple facilities

AI-based demand forecasting

Dynamic driver routing

Real-time tracking

Franchise model

1️⃣2️⃣ DEVELOPMENT APPROACH
Phase 1 – Backend Core

Auth

Role system

Order state machine

Billing engine

Phase 2 – Admin Panel

Order dashboard

Staff management

Reports

Phase 3 – Customer App

Order flow

Tracking

Payments

Phase 4 – Driver App

Task management

Pickup & delivery flow

🎯 FINAL OBJECTIVE

Build a production-ready, scalable, structured quick-commerce laundry platform with:

Clear state management

Clean RBAC

Strict backend validation

Optimized DB design

Expandable architecture