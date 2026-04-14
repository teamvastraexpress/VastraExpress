# Vastra Express V2 Presentation Brief

## Project Summary

Vastra Express is a multi-app laundry logistics and fulfillment platform built as a monorepo. It coordinates the full operational flow of a laundry business: customer booking, pickup assignment, facility processing, delivery execution, inventory monitoring, and management reporting.

The current V2 direction is operational-first. Billing, payments, and refund workflows were intentionally removed so the platform focuses on end-to-end service execution rather than financial processing.

## One-Line Problem Statement

Laundry operations are usually fragmented across phone calls, manual registers, and disconnected staff coordination, which causes poor tracking, delayed pickups, weak visibility, and hard-to-scale operations.

## Objectives

- Centralize order intake and status tracking.
- Separate workflows for customer, admin, facility, and driver roles.
- Support pickup scheduling, facility processing, and last-mile delivery.
- Provide inventory and reporting visibility for operational control.
- Keep the system scalable across multiple facilities and cities.

## Why This Project Matters

This is a real operations platform, not a demo-only app. It solves a practical business problem where speed, role separation, and traceable status updates matter every day. The value comes from reducing manual coordination and creating a consistent workflow from booking to delivery.

## Innovation & Originality

- Multi-portal architecture with role-specific experiences for admin, facility staff, drivers, and customers.
- A unified order lifecycle that drives all apps through the same backend state machine.
- V2 simplification by removing payment complexity and keeping the product focused on operations.
- Separate web and mobile clients built for the context of each user type instead of forcing one interface for everyone.

## Methodology / Design Approach

The project is designed as a modular monorepo:

- Backend: NestJS REST API with Prisma and MySQL.
- Admin portal: Next.js dashboard for platform oversight.
- Facility portal: Next.js workflow board for processing operations.
- Driver web app: Next.js task management for pickups and deliveries.
- Customer web app: Next.js portal for booking and tracking.
- Customer mobile app: Expo app for on-the-go user access.
- Driver mobile app: Expo app for field operations.

The core design pattern is a state-machine driven workflow. Orders move through defined statuses such as order creation, pickup, facility processing, readiness for dispatch, and delivery completion. This keeps transitions predictable and makes the whole system easier to validate.

## Repository Structure Overview

### Backend

- `auth`: OTP login, JWT, role-based access control.
- `users`: user and role management.
- `addresses`: saved customer addresses.
- `pickup-slots`: scheduling windows for facility operations.
- `orders`: order lifecycle, state transitions, and history.
- `delivery`: driver assignment and execution.
- `inventory`: stock monitoring and low-stock control.
- `notifications`: SMS and push notification support.
- `reports`: operational dashboards and summaries.
- `facilities`: facility records and staff linkage.

### Web and Mobile Clients

- Admin portal: oversight, reporting, orders, users, slots, inventory, delivery.
- Facility portal: order pipeline, weights, assignments, processing, and readiness.
- Driver web: pickup and delivery task execution.
- Customer web: booking, order tracking, address/profile management.
- Customer mobile: booking and tracking from mobile.
- Driver mobile: task handling from mobile.

## Implementation & Technical Complexity

The implementation shows solid technical depth across backend, frontend, and data layers.

- Backend uses NestJS, Prisma, MySQL, JWT, throttling, and schedule support.
- Data model includes users, roles, facilities, pickup slots, orders, delivery assignments, inventory, and history tables.
- Frontend uses Next.js App Router, Zustand state management, Axios, and Tailwind-based UI.
- Mobile apps use Expo Router, NativeWind, and local state/auth handling.
- Role-based access is enforced across different portals.
- Dashboards include live KPIs, order tables, pipeline views, charts, and task boards.

## Results & Analysis

This repository does not contain a machine-learning model, so there is no ANN/ML accuracy metric to report. Instead, the measurable results are operational:

- Dashboard KPIs for orders, customers, deliveries, facilities, and stock.
- Live order pipeline and task assignment views.
- Status tracking through a defined lifecycle.
- Inventory low-stock detection.
- Operational reports and charts in the admin dashboard.

If you want to show evidence during the presentation, focus on:

- throughput of orders across stages,
- visibility of live tasks,
- correct state transitions,
- dashboard summaries and charts,
- and reduced manual effort compared with a paper-based process.

## Real-World Applicability

The system is practical for laundry chains, multi-branch facilities, and quick-commerce style pickup-and-delivery services. It can scale because it separates concerns by role, keeps a shared backend contract, and can support more facilities or cities without redesigning the whole workflow.

## Demonstration / Working Model

For a live demo, present the flow in this order:

1. Customer logs in or registers.
2. Customer books a pickup and selects an address.
3. Admin or facility sees the order in the pipeline.
4. Driver receives pickup assignment and updates task status.
5. Facility receives the order, processes it, and marks it ready for dispatch.
6. Delivery driver completes the final delivery.
7. Admin dashboard shows summary counts and recent order activity.

## Suggested Presentation Flow

1. Start with the problem in manual laundry operations.
2. Introduce Vastra Express as an operational platform.
3. Explain the multi-app architecture.
4. Walk through the order lifecycle.
5. Show the dashboards and role-specific portals.
6. Conclude with scalability and real-world usefulness.

## Viva Preparation Points

### Problem Definition & Objectives

- The core problem is fragmented, manual, and hard-to-track laundry operations.
- The objective is to digitize booking, processing, dispatch, and tracking in one system.

### Innovation & Originality

- The originality is in the operational workflow design and multi-role architecture, not in ML.
- V2 removes financial clutter and tightens the product around execution.

### Methodology / Design Approach

- The project uses a modular client-server architecture.
- A backend state machine controls order progression.

### Implementation & Technical Complexity

- The project spans backend modules, multiple web apps, and two Expo apps.
- It uses typed APIs, role guards, status history, dashboards, and inventory management.

### Results & Analysis

- The repository demonstrates functional workflow coverage and live KPI views.
- There are no ML accuracy numbers because the project is not an ML system.

### Real-World Applicability

- Useful for laundry businesses that need centralized control and staff coordination.

### Presentation Skills

- Keep the story simple: problem, solution, architecture, demo, impact.

### Demonstration / Working Model

- Show the order moving through the system end to end.

### Viva / Question Handling

- Be ready to explain why separate apps exist for each role.
- Be ready to explain the order state machine and the V2 billing removal.

## Short Answer Bank for Viva

- Why separate apps? Because each user role needs a different workflow and different permissions.
- Why NestJS and Prisma? They give a structured backend with type-safe database access.
- Why state machine design? It makes order transitions predictable and easier to validate.
- Why remove billing in V2? To narrow scope and focus on operational reliability.
- Is this an ML project? No. It is an operational software system.

## Key Takeaway

Vastra Express V2 is best presented as a production-style laundry operations platform with strong workflow design, multi-role architecture, and practical real-world value.