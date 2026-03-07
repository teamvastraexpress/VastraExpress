📄 SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
Project: Quick Commerce Laundry Platform
Version: 1.0
Prepared For: Client Production Deployment
Prepared By: Me
________________________________________
1. INTRODUCTION
1.1 Purpose
This document defines the functional and non-functional requirements for the Quick Commerce Laundry Platform. The system will enable customers to schedule laundry pickups, track orders, receive itemized billing, and manage subscriptions, while allowing operational staff to manage processing, inventory, delivery, and administration through web dashboards.
________________________________________
1.2 Scope
The platform will:
•	Digitize end-to-end laundry workflow
•	Provide OTP-based authentication
•	Enable slot-based pickup scheduling
•	Support hybrid billing (per kg + per item)
•	Provide subscription wallet system
•	Allow real-time order lifecycle tracking
•	Support GST-compliant billing
•	Include admin, facility, and driver management panels
•	Be scalable to multi-city and multi-facility architecture
Initial deployment:
Single city, single processing facility
Future: Multi-city scalable
________________________________________
2. OVERALL DESCRIPTION
2.1 Product Perspective
The system consists of:
1.	Mobile Application (Customer)
2.	Web Dashboard (Delivery Drivers)
3.	Web Dashboard (Processing Facility)
4.	Web Dashboard (Admin)
5.	Backend API Server
6.	Centralized Database
7.	Payment Gateway Integration (Razorpay)
8.	Notification System (Firebase + SMS)
Hosted on Hostinger VPS (Production Environment).
________________________________________
2.2 User Classes
1. Customer (Mobile App)
•	OTP registration
•	Address management (multiple)
•	Slot booking
•	Subscription purchase
•	Order tracking
•	Bill viewing
•	Payment
•	Reviews
2. Delivery Driver (Web)
•	View assigned orders
•	Enter pickup weight
•	Enter item details
•	Mark paid/unpaid
•	Update pickup/delivery status
Assignment: Manual by Processing Facility
3. Processing Facility (Web)
•	View all orders
•	Assign drivers
•	Manage slots
•	Update order status
•	Generate itemized bill
•	Manage inventory
•	Monitor staff
4. Admin (Web)
•	Global dashboard
•	Revenue & expense tracking
•	Staff management
•	Pricing configuration
•	Subscription plan management
•	Inventory access
•	Refund management
________________________________________
3. SYSTEM FEATURES
________________________________________
3.1 User Authentication
•	OTP-based mobile number registration
•	JWT-based session management
•	Role-based access control (RBAC)
•	Separate access layers for:
o	Admin
o	Facility
o	Driver
o	Customer
________________________________________
3.2 Address Management
•	Multiple addresses supported
•	Fields:
o	House/Flat No
o	Street
o	Landmark
o	Pincode
o	City
•	Pincode validation required
________________________________________
3.3 Pickup Slot Management
•	Slots created and managed by Processing Facility
•	Rescheduling allowed until 1 hour before pickup
•	Cancellation allowed until 1 hour before pickup
•	Slot availability dynamically updated
•	Future-ready for slot capacity control
________________________________________
3.4 Order Lifecycle
Order States:
1.	Placed
2.	Assigned for Pickup
3.	Picked Up
4.	Received at Facility
5.	Processing
6.	Ready for Delivery
7.	Out for Delivery
8.	Delivered
9.	Closed
Partial delivery allowed.
All transitions logged for audit trail.
________________________________________
3.5 Pricing Logic
Hybrid pricing model:
•	Per kg pricing
•	Per item pricing
•	Different service types:
o	Wash & Fold
o	Dry Clean
o	Iron Only
Minimum order value: ₹500
Express delivery charges applicable.
Pickup/Delivery:
•	Free for subscribers
•	Chargeable for non-subscribers (configurable)
Pricing configurable via Admin panel.
________________________________________
3.6 Subscription Model
•	Monthly subscription
•	Wallet-based prepaid model
•	Auto-renew enabled
•	Free pickup benefit
•	Multiple plan types supported
•	Wallet balance auto-deducted
•	Refundable via admin
________________________________________
3.7 Billing System
•	Delivery driver enters initial weight
•	Facility confirms final weight
•	Itemized bill generated
•	GST-compliant invoice
•	Bill visible in customer app
•	Payment modes:
o	Razorpay (UPI, Cards)
o	Cash on Delivery
•	Payment before delivery or at delivery supported
•	Refunds handled via Admin panel
________________________________________
3.8 Notifications
Channels:
•	Firebase Push Notifications
•	SMS
Trigger Events:
•	Pickup scheduled
•	Pickup completed
•	Received at facility
•	Bill generated
•	Out for delivery
•	Delivered
________________________________________
3.9 Inventory Management
Tracked Items:
•	Detergents
•	Packaging materials
•	Tags
•	Machinery logs
•	Miscellaneous
Editable by:
•	Admin
•	Processing Facility
Low stock alerts enabled.
________________________________________
3.10 Staff Management
•	Managed by Admin
•	Facility staff share same access level
•	Distinct roles:
o	Admin
o	Facility
o	Driver
________________________________________
3.11 Dashboard & Reporting
Admin Dashboard KPIs:
•	Daily orders
•	Monthly revenue
•	Expenses
•	Subscription usage
•	Order status distribution
•	Growth trends
Facility Dashboard:
•	Orders per stage
•	Driver assignments
•	Inventory levels
Expected Load:
~100 daily orders initially
Architecture scalable for higher throughput
________________________________________
4. NON-FUNCTIONAL REQUIREMENTS
________________________________________
4.1 Performance
•	API response time < 2 seconds
•	Support 100+ daily orders
•	Designed for horizontal scalability
________________________________________
4.2 Security
•	JWT authentication
•	Role-based access
•	Secure payment integration
•	Encrypted data transmission (HTTPS)
•	GST-compliant billing storage
________________________________________
4.3 Scalability
Database designed for:
•	Multi-city
•	Multi-facility
•	Facility mapping per order
•	City-based pricing configuration
________________________________________
4.4 Availability
•	99% uptime target
•	Daily database backup
•	VPS monitoring required
________________________________________
4.5 Maintainability
•	Modular backend architecture
•	Separate service layers:
o	Auth
o	Orders
o	Billing
o	Inventory
o	Subscription
•	Clear API documentation
________________________________________
5. SYSTEM ARCHITECTURE (PROPOSED)
Frontend:
•	Next.js 14
•	React 18
•	TypeScript 5
•	Tailwind 3.4
Mobile:
•	React Native 0.73+
Backend:
•	Node.js 20 LTS
•	NestJS 10
•	Prisma ORM
Database:
•	MySQL 8.0
Notifications:
•	Firebase Cloud Messaging

SMS:
•	MSG91 API
Hosting:
•	Hostinger VPS (Ubuntu 22.04)
•	NGINX
•	PM2
Auth:
•	JWT
•	bcrypt
________________________________________
6. DATABASE HIGH-LEVEL ENTITIES
•	Users
•	Roles
•	Cities (future-ready)
•	Facilities
•	Staff
•	Addresses
•	PickupSlots
•	Orders
•	OrderItems
•	OrderStatusLogs
•	PricingConfigurations
•	Subscriptions
•	WalletTransactions
•	Payments
•	Refunds
•	DeliveryAssignments
•	InventoryItems
•	InventoryLogs
•	Reviews
________________________________________
7. CONSTRAINTS
•	1-month development timeline
•	Primarily solo developer
•	Production-grade delivery
•	VPS deployment
________________________________________
8. FUTURE ROADMAP (Not in Phase 1)
•	Multi-facility auto routing
•	Driver mobile app
•	Route optimization
•	AI demand forecasting
•	Analytics engine
•	Customer segmentation
________________________________________
9. APPROVAL
This SRS serves as the baseline requirement document for development. Any modification requires version update.
________________________________________