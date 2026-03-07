# Vastra Express — Stakeholder Meeting Report

**Prepared on:** March 7, 2026  
**Purpose:** Simple business-facing summary of the product, how it works, and what it is likely to cost to launch.

---

## 1. Executive Summary

Vastra Express is a **quick-commerce laundry platform** that manages the full laundry journey:

- customer booking,
- pickup scheduling,
- driver assignment,
- facility processing,
- billing,
- payment,
- delivery,
- subscriptions,
- and status notifications.

The project is built as **one shared backend platform** with multiple role-based apps:

- **Customer mobile app**
- **Driver mobile app**
- **Customer website**
- **Driver website**
- **Facility web dashboard**
- **Admin web dashboard**

All of these connect to the **same Node.js/NestJS backend** and **same MySQL database**.

---

## 2. Hosting Cost on Hostinger VPS

### Recommended Hosting Approach

For the current version of this project, **one VPS is enough for the initial launch**.

That is because the platform currently has:

- 1 backend API server,
- 1 MySQL database,
- 4 web frontends,
- native mobile apps that do **not** need to be hosted on the VPS,
- expected early load of roughly **100 daily orders**.

### Best-Fit Hostinger VPS Plan

### Recommended Plan: **Hostinger KVM 4**

Hostinger pricing page currently shows:

- **KVM 2:** 2 vCPU, 8 GB RAM, 100 GB NVMe, 8 TB bandwidth — **$8.99/month promo**, **$14.99/month renewal**
- **KVM 4:** 4 vCPU, 16 GB RAM, 200 GB NVMe, 16 TB bandwidth — **$12.99/month promo**, **$28.99/month renewal**

### Why KVM 4 is the safer recommendation

This project is not just one website. In production it will run:

- **NestJS backend API**
- **Admin Next.js app**
- **Facility Next.js app**
- **Customer web Next.js app**
- **Driver web Next.js app**
- **MySQL database**
- **Nginx reverse proxy**
- **PM2 process manager**

That means the server is hosting **multiple Node.js processes plus MySQL** on the same machine.

### Approximate resource reasoning

For a practical launch setup:

- Backend API: about **0.5–1 GB RAM**
- MySQL: about **1.5–3 GB RAM**
- 4 Next.js apps combined: about **3–5 GB RAM**
- OS + Nginx + PM2 + logs + headroom: about **1.5–3 GB RAM**

That puts realistic usage around **6.5–12 GB RAM** depending on traffic spikes.

So:

- **KVM 2 (8 GB RAM)** can work for a very lean pilot launch,
- **KVM 4 (16 GB RAM)** is the better business-safe choice.

---

## 3. Hosting Cost Estimate

### Recommended planning number

For stakeholder budgeting, I recommend using **KVM 4** as the baseline.

| Item | Monthly | Yearly |
|---|---:|---:|
| Hostinger KVM 4 (promo price) | **$12.99** | **$155.88** |
| Hostinger KVM 4 (renewal price) | **$28.99** | **$347.88** |

### Budget-safe recommendation

For planning purposes, present the hosting cost as:

- **Initial likely VPS cost:** about **$13/month**
- **Steady-state realistic VPS cost:** about **$29/month**

If you want INR-style planning using roughly **$1 ≈ ₹83**:

- **$12.99/month ≈ ₹1,080/month**
- **$28.99/month ≈ ₹2,406/month**

---

## 4. How the VPS Cost Is Calculated

### Backend server requirements

The backend is a **NestJS API** with modules for:

- authentication,
- users,
- addresses,
- orders,
- billing,
- subscriptions,
- payments,
- delivery,
- inventory,
- notifications,
- reporting,
- facilities.

This is heavier than a simple brochure website because it handles business workflows and role-based operations.

### Database

The backend uses **MySQL 8** with **Prisma ORM**.

The schema has **20 core tables/models**, including:

- users and roles,
- addresses,
- facilities and staff,
- pickup slots,
- orders and status history,
- itemized billing,
- subscription plans and wallets,
- payments and refunds,
- delivery assignments,
- inventory,
- reviews.

This is a normal transactional business database, not a large analytics database, so early storage needs are moderate.

### API load

At the stated starting scale of **~100 orders/day**, the API load is still moderate.

Each order creates multiple API events such as:

- booking,
- slot lookup,
- order creation,
- driver assignment,
- status updates,
- billing,
- payment,
- notifications,
- tracking views.

That creates many requests, but still fits comfortably within a single mid-range VPS.

### Storage

Early-stage storage needs are mainly:

- app builds,
- server logs,
- MySQL data,
- backups.

Expected starting storage need is roughly:

- **code/builds/logs:** 10–20 GB
- **database growth:** 5–20 GB early stage
- **backup space/headroom:** 20–50 GB

So **100 GB is workable**, but **200 GB is more comfortable**.

### Expected traffic

This project is designed for:

- one city initially,
- one processing facility initially,
- moderate early traffic,
- later expansion to more cities and facilities.

Because it is not launching as a mass-market national app on day one, a single VPS is a reasonable starting point.

### Node.js runtime

All main hosted services are **Node.js-based**:

- NestJS backend
- Next.js web apps

This is another reason to avoid the smallest VPS plan unless the launch is very limited.

### MySQL database

MySQL can run on the same VPS initially. That keeps cost low and setup simple.

### Is one VPS enough?

**Yes — for launch, one VPS is enough.**

Recommended production shape for launch:

- **1 Hostinger VPS**
- **Nginx** for domain routing/reverse proxy
- **PM2** for Node process management
- **MySQL on the same VPS**
- **Let’s Encrypt SSL**

### When multiple services may be needed later

Move beyond one VPS when you reach any of the following:

- multi-city expansion,
- much higher daily order volume,
- need for zero-downtime upgrades,
- larger reporting/analytics load,
- stricter backup and disaster recovery needs.

At that stage, the usual next step is:

- keep apps on one VPS,
- move MySQL to a separate server or managed database,
- optionally add Redis/cache and CDN.

---

## 5. App Deployment Costs

The mobile side includes **two native apps** to publish later:

- **Customer app**
- **Driver app**

One developer account per platform is enough to publish both apps under the same business.

### Android (Google Play)

- **Developer account fee:** typically **$25 one-time**
- This fee is **not per app**
- So both Android apps can be published under the same Play Console account

### Additional Android publishing costs

Usually optional or operational, not mandatory platform fees:

- screenshots / store listing design,
- privacy policy hosting,
- testing devices,
- optional Expo EAS paid build plan if faster cloud builds are needed.

### iOS (Apple App Store)

- **Apple Developer Program:** **$99/year**
- This membership covers both iOS apps under one account

### Additional iOS requirements

- Apple account with 2-factor authentication
- If publishing as a company, Apple may require a **D-U-N-S number**
- real-device testing is strongly recommended
- app review compliance, privacy policy, screenshots, and support contact are required

### Total publishing cost for both apps

| Item | Cost |
|---|---:|
| Google Play developer account | **$25 one-time** |
| Apple Developer Program | **$99/year** |
| **Total initial first-year publishing cost** | **$124** |

Approximate INR value at $1 ≈ ₹83:

- **$124 ≈ ₹10,292**

### Important note

This project’s own progress notes show that native app publishing work is **not fully finished yet**. Remaining tasks include:

- Firebase mobile setup,
- EAS build configuration,
- native payment SDK integration,
- physical device testing,
- store-ready builds.

So the fees above are the **platform fees**, not the remaining implementation effort.

---

## 6. Project Overview

### What the project does

Vastra Express is a digital platform for running a **pickup-and-delivery laundry business**.

It helps a laundry company manage the entire journey from customer booking to final delivery.

### The problem it solves

Traditional laundry operations are often fragmented:

- bookings are manual,
- pickup scheduling is hard to track,
- driver coordination is messy,
- status updates are unclear,
- billing can be inconsistent,
- subscription customers are difficult to manage at scale.

Vastra Express solves this by putting the full business workflow into one connected system.

### How users interact with the system

#### Customer

- books laundry pickup,
- selects address and slot,
- tracks order,
- sees bill,
- pays online or COD,
- can use subscription plans.

#### Driver

- sees assigned pickups and deliveries,
- updates status,
- records pickup weight,
- handles COD collection.

#### Facility staff

- receives items,
- moves orders through processing stages,
- confirms weight,
- adds itemized billing,
- prepares orders for dispatch.

#### Admin

- monitors the business,
- manages pricing,
- manages staff,
- views reports,
- handles subscriptions and refunds.

---

## 7. How the System Works

### High-level flow

1. Customer logs in using mobile OTP.  
2. Customer selects address, service, and pickup slot.  
3. Backend creates the order and assigns it to the correct facility.  
4. Facility assigns a driver for pickup.  
5. Driver collects laundry and records initial weight.  
6. Facility receives the order and moves it through sorting, washing, ironing, and packing.  
7. Bill is generated.  
8. Customer pays online or pays on delivery.  
9. Facility assigns delivery.  
10. Driver delivers the order.  
11. Customer receives the order and the lifecycle closes.  

### Order lifecycle

The system already supports a detailed order state flow including:

- order created,
- pickup scheduled,
- pickup assigned,
- picked up,
- received at facility,
- sorting,
- washing,
- ironing,
- packing,
- bill generated,
- ready for dispatch,
- out for delivery,
- delivered,
- plus failure/cancellation/refund states.

### Payment and subscriptions

The system supports:

- **Razorpay** for online payments,
- **cash on delivery**,
- **subscription plans**,
- **wallet-style prepaid balance**,
- **refund handling**.

---

## 8. Technology Stack

### Frontend web

- **Next.js** for admin, facility, customer web, and driver web
- Chosen because it is modern, fast, SEO-friendly for the customer site, and works well for dashboard-style applications

### Mobile app

- **Expo / React Native** for customer and driver mobile apps
- Chosen because one codebase can target Android and iOS efficiently

### Backend

- **Node.js + NestJS**
- Chosen because NestJS is strong for modular APIs, business workflows, and role-based enterprise-style systems

### Database

- **MySQL 8** with **Prisma ORM**
- Chosen because it is reliable for structured business data and Prisma makes development safer and faster

### Notifications

- **Firebase Cloud Messaging (FCM)** for push notifications
- **MSG91** for OTP and SMS alerts

### Payments

- **Razorpay**

### Hosting

- **Hostinger VPS**
- **Nginx** for routing
- **PM2** for running Node apps reliably
- **Let’s Encrypt** for SSL

---

## 9. Architecture Overview

### How frontend communicates with backend

All apps use the **same REST API**.

- web apps use Axios over HTTPS,
- mobile apps use the same API endpoints,
- authentication is based on JWT tokens,
- each role only sees the data allowed for that role.

### API structure

The backend is modular, with separate API areas for:

- auth,
- users,
- addresses,
- orders,
- billing,
- subscriptions,
- payments,
- delivery,
- inventory,
- notifications,
- reports,
- facilities.

### Database role

The database is the central source of truth for:

- users,
- orders,
- statuses,
- pricing,
- payments,
- subscriptions,
- delivery assignments,
- inventory,
- reports.

### Mobile integration

The mobile apps do not have separate backends.

They use the same main backend as the websites. This keeps the platform consistent and reduces operational complexity.

---

## 10. Key Features

- OTP login for customers and staff flows
- multi-role platform (customer, driver, facility, admin)
- address management
- pickup slot booking
- real-time order lifecycle tracking
- driver assignment and delivery tracking
- itemized and weight-based billing
- subscription plans and wallet support
- online payment and COD support
- push notifications and SMS alerts
- inventory management
- admin reports and dashboards
- multi-city / multi-facility ready data design

---

## 11. Optional Operational Cost Estimates

These are not strict platform fees, but likely real operating costs.

### VPS hosting

- Recommended planning number: **$13–$29/month** depending on promo vs renewal

### Firebase notifications

- **Firebase Cloud Messaging itself is effectively free** for normal push notification usage
- so push notifications are not a major cost driver here

### SMS services (MSG91)

This depends on message volume and MSG91 pricing plan.

Practical early-stage estimate for India:

- around **₹0.15 to ₹0.30 per SMS** is a useful planning range

If the business sends roughly **8,000 to 15,000 SMS/month** across OTP and order updates:

- expected monthly SMS cost could be roughly **₹1,200 to ₹4,500/month**

If SMS is used very heavily for every order milestone, this can go higher.

### Payment gateway charges

Razorpay pricing page currently states:

- **2% platform fee on transactions**
- **18% GST extra on that fee**

So the effective planning rate is roughly:

- **2.36% of online payment value**

Example:

- If monthly online collections are **₹2,00,000**,
- gateway cost is about **₹4,000 + GST = ₹4,720/month**

COD payments do not incur gateway charges.

### Storage / backups

- basic storage is included in the VPS plan
- offsite backups or extra storage may add roughly **₹300 to ₹800/month** depending on method

### Domain and SSL

- domain name: usually about **₹800 to ₹1,500/year** depending on domain type
- SSL via Let’s Encrypt: **free**

---

## 12. Simple Recommendation for Stakeholders

### Launch recommendation

For the current project scope, a sensible launch setup is:

- **1 Hostinger KVM 4 VPS**
- **1 MySQL database on the same VPS**
- **Nginx + PM2 + SSL**
- publish customer and driver apps later after store-readiness tasks are completed

### Budget summary

#### Mandatory launch platform costs

- **VPS hosting:** about **$13/month initially**, plan for **$29/month steady-state**
- **Google Play account:** **$25 one-time**
- **Apple Developer Program:** **$99/year**

### First-year minimum practical platform budget

If using promo VPS pricing:

- VPS: **$155.88/year**
- Google Play: **$25 one-time**
- Apple Developer: **$99/year**
- **Total first-year platform baseline: $279.88**

If using renewal-style VPS planning instead of promo pricing:

- VPS: **$347.88/year**
- Google Play: **$25 one-time**
- Apple Developer: **$99/year**
- **Total first-year platform baseline: $471.88**

This excludes:

- SMS usage,
- payment gateway transaction fees,
- optional backup/storage add-ons,
- design/testing/QA effort.

---

## 13. Final Conclusion

Vastra Express is already structured like a real operational platform, not just a demo website.

It has:

- a strong backend,
- role-based business dashboards,
- customer and driver experiences,
- payment and subscription support,
- and a data model ready for business growth.

For an initial city launch, **one mid-range VPS is enough** and **Hostinger KVM 4** is the safest recommendation.

If you want a simple stakeholder line:

> **“We can launch the platform on a single Hostinger VPS for about $13/month initially, but we should budget closer to $29/month long-term, plus app store fees of about $124 for Android and iOS publishing.”**
