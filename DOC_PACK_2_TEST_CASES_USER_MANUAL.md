# Vastra Express Documentation Review - Pack 2

Document Date: 18 April 2026
Scope: Test cases with test data, execution guidance, and role-based user manual.

---

## 1. Test Data Set (UAT and QA Baseline)

### 1.1 Master Data

| Entity | Sample Value 1 | Sample Value 2 | Notes |
|---|---|---|---|
| State | Maharashtra | Karnataka | Use active states only |
| City | Mumbai | Bengaluru | Must exist before facility setup |
| Facility | Mumbai Central Facility | Bengaluru South Facility | Facility code must be unique |
| Facility Code | MUM_CENTRAL_01 | BLR_SOUTH_01 | Unique constraint applies |

### 1.2 Role Accounts

| Role | Mobile | Name | Credential Method |
|---|---|---|---|
| ADMIN | 9000000001 | Admin One | Username and password |
| FACILITY_STAFF | 9000000002 | Facility Staff One | First login OTP then password |
| DRIVER | 9000000003 | Driver One | OTP flow in beta |
| CUSTOMER | 9000000004 | Customer One | OTP flow |

### 1.3 Customer Address and Slot Data

| Data Type | Sample |
|---|---|
| Address 1 | House: 12A, Street: MG Road, Landmark: Near Metro, Pincode: 400053, City: Mumbai |
| Address 2 | House: B-204, Street: 5th Main, Landmark: Tech Park, Pincode: 560102, City: Bengaluru |
| Slot 1 | Date: Today, Time: 09:00-11:00, Capacity: 20 |
| Slot 2 | Date: Tomorrow, Time: 11:00-13:00, Capacity: 20 |

### 1.4 Order and Inventory Seed Values

| Data Type | Sample |
|---|---|
| Service Type (valid) | WASH_FOLD, DRY_CLEAN, IRON_ONLY |
| Service Type (negative test) | WASH_IRON |
| Order Notes | Please handle white shirts separately |
| Inventory Item | Ariel Detergent Powder |
| Inventory Category | DETERGENT |
| Inventory Quantity | 50 |
| Low Stock Threshold | 5 |

---

## 2. Test Cases with Test Data

Legend:
- Priority: H (High), M (Medium), L (Low)
- Type: P (Positive), N (Negative), S (Security), R (Regression)

### 2.1 Authentication and Authorization

| TC ID | Priority | Type | Scenario | Test Data | Expected Result |
|---|---|---|---|---|---|
| AUTH-01 | H | P | Send OTP with valid customer mobile | 9000000004 | OTP sent response success |
| AUTH-02 | H | N | Send OTP with invalid mobile format | 123 | Validation error returned |
| AUTH-03 | H | P | Verify OTP with valid 6-digit OTP and name | mobile 9000000004, otp 6-digit, name Customer One | JWT returned, user profile returned |
| AUTH-04 | H | N | Verify OTP with wrong OTP | mobile valid, otp 999999 | Invalid OTP error |
| AUTH-05 | H | S | Access protected profile endpoint without token | none | 401 unauthorized |
| AUTH-06 | H | P | Facility first login setup with OTP and password | mobile 9000000002, otp valid, password StrongPass1 | Account setup succeeds |
| AUTH-07 | H | N | Facility login with wrong password | mobile 9000000002, wrong password | Login denied |
| AUTH-08 | H | S | Staff-check with unregistered staff number | mobile not in staff | Exists false, no access granted |
| AUTH-09 | M | N | Staff setup with password shorter than 8 chars | password 1234567 | Validation error |
| AUTH-10 | M | N | Verify OTP with non-digit OTP | otp ABC123 | Validation error |

### 2.2 Customer Profile, Address, and Booking

| TC ID | Priority | Type | Scenario | Test Data | Expected Result |
|---|---|---|---|---|---|
| CUST-01 | H | P | Register profile with valid name and email | name Customer One, email test@demo.com | Profile saved |
| CUST-02 | H | N | Register profile with invalid name characters | name Test123 | Name validation error |
| CUST-03 | H | P | Add address with valid required fields | House, street, pincode 400053, cityId valid | Address created |
| CUST-04 | H | N | Add address with invalid pincode | pincode 4005 | Validation error |
| CUST-05 | H | P | Book order complete flow | addressId valid, slotId valid, service WASH_FOLD | Order created and visible in orders list |
| CUST-06 | H | N | Attempt booking without address selection | no address selected in step 1 | UI blocks progression |
| CUST-07 | H | N | Attempt booking without slot selection | no slot selected in step 2 | UI blocks progression |
| CUST-08 | H | N | Create order with unsupported service type | serviceType WASH_IRON | API rejects enum value |
| CUST-09 | M | P | Mark an address as default | existing non-default address | Default switches successfully |
| CUST-10 | M | P | Delete address and refresh list | existing address id | Address removed from list |

### 2.3 Admin User and Master Data Management

| TC ID | Priority | Type | Scenario | Test Data | Expected Result |
|---|---|---|---|---|---|
| ADM-01 | H | P | Create driver staff account | mobile 9000000003, role DRIVER | Driver account created |
| ADM-02 | H | N | Create staff with invalid mobile | 123456 | Validation error |
| ADM-03 | H | P | Change role DRIVER to FACILITY_STAFF | existing user id | Role updated |
| ADM-04 | H | P | Deactivate and reactivate user | existing user | Status toggles |
| ADM-05 | H | P | Add city with valid state and name | Bengaluru, Karnataka | City created |
| ADM-06 | H | N | Add duplicate city and state combination | existing city and state | Conflict or duplicate handling |
| ADM-07 | H | P | Add facility and map city | cityId valid, facility code unique | Facility created |
| ADM-08 | H | N | Add facility with duplicate code | existing code | Unique constraint error |

### 2.4 Slot and Delivery Operations

| TC ID | Priority | Type | Scenario | Test Data | Expected Result |
|---|---|---|---|---|---|
| OPS-01 | H | P | Create pickup slot | facilityId 1, date today, 09:00-11:00, cap 20 | Slot created |
| OPS-02 | H | N | Create slot with endTime invalid format | endTime 25:30 | Validation error |
| OPS-03 | H | N | Create duplicate slot for same facility date startTime | same facility and date and startTime | Unique key conflict |
| OPS-04 | H | P | Block day for selected facility | date today, facilityId 1 | All slots set inactive |
| OPS-05 | H | P | Unblock day for selected facility | date today, facilityId 1 | All slots set active |
| OPS-06 | H | P | Assign driver to order | valid orderId, valid driverId, DELIVERY | Assignment created |
| OPS-07 | H | P | Driver updates assignment sequence | ASSIGNED to IN_PROGRESS to ARRIVED to COMPLETED | Status updates persist |
| OPS-08 | H | N | Driver updates invalid status string | status INVALID_STATE | Request rejected or guarded |

### 2.5 Inventory and Reporting

| TC ID | Priority | Type | Scenario | Test Data | Expected Result |
|---|---|---|---|---|---|
| INV-01 | H | P | Add inventory item | item Ariel, category DETERGENT, qty 50 | Item created |
| INV-02 | H | N | Add inventory with negative quantity | qty -1 | Validation error |
| INV-03 | M | P | Log consumption transaction | quantityChange -2.5 | Balance updated and log entry added |
| REP-01 | H | P | Admin dashboard report fetch | GET reports/dashboard as admin | KPI payload returned |
| REP-02 | H | S | Facility staff tries admin-only report endpoint | GET reports/drivers as facility | Access denied |
| REP-03 | H | P | Facility order report scope check | reports/orders with another facilityId | Data restricted to own facility |
| REP-04 | M | R | Admin reports page daily chart mapping | UI expects dailyRevenue, API returns dailyOrders | Chart mapping gap observed |
| REP-05 | M | R | Facility reports KPI payload check | UI expects monthlyRevenue and revenueByDay | KPI defaults or empty chart observed |

### 2.6 State Machine and Security Regression

| TC ID | Priority | Type | Scenario | Test Data | Expected Result |
|---|---|---|---|---|---|
| STM-01 | H | P | Main order flow transition validity | ORDER_CREATED to DELIVERED path | Each valid transition accepted |
| STM-02 | H | N | Invalid transition skip | ORDER_CREATED to PICKED_UP | Rejected by state machine |
| STM-03 | H | N | Customer cancel after pickup started | OUT_FOR_PICKUP to CANCELLED by CUSTOMER | Rejected |
| STM-04 | H | P | Admin cancel before picked up | OUT_FOR_PICKUP to CANCELLED by ADMIN | Accepted per rule |
| SEC-01 | H | S | Customer token calls admin users endpoint | CUSTOMER JWT | Forbidden |
| SEC-02 | H | S | Missing token on protected endpoint | no auth header | Unauthorized |
| SEC-03 | M | S | Invalid facilityId query on reports/orders | facilityId abc | Bad request validation error |
| SEC-04 | M | S | OTP brute-force attempts | repeated wrong OTP | Lock or rejection behavior confirmed |

---

## 3. Test Execution Procedure

### 3.1 Environment Checklist

1. Backend reachable at /api path.
2. Required web apps reachable (admin, facility, customer-web, driver-web).
3. Seeded role accounts available.
4. City and facility data created before order and slot tests.
5. OTP fallback method available for beta (web notification or debug otp).

### 3.2 Evidence Capture Template

| Field | Example |
|---|---|
| Test Case ID | AUTH-03 |
| Build Version | Beta build date |
| Tester | QA-01 |
| Preconditions | User exists and OTP sent |
| Steps | 1..4 |
| Actual Result | JWT returned, profile correct |
| Pass or Fail | Pass |
| Screenshot or Log Link | path or ticket |
| Defect ID (if fail) | BUG-214 |

---

## 4. User Manual (Role-wise)

## 4.1 Admin User Manual

### Login

1. Open admin portal URL.
2. Enter admin username and password.
3. On success, dashboard opens with KPI cards.

### Daily Operating Flow

1. Open Settings and verify cities and facilities are active.
2. Open Users and create or manage staff accounts.
3. Open Slots and ensure pickup capacity is available for active dates.
4. Open Orders and monitor order progression.
5. Open Delivery and review assignment completion.
6. Open Reports for date-range analytics and driver performance review.

### Admin Validation Rules to Remember

1. Staff mobile must be 10-digit Indian number.
2. Role assignment restricted to supported staff roles.
3. Duplicate facility codes are not allowed.
4. Duplicate slot same facility date and start-time is blocked.

## 4.2 Facility Staff User Manual

### First Login

1. Open facility portal login.
2. Enter registered mobile.
3. If first login, enter OTP then set password.
4. Continue to dashboard.

### Routine Tasks

1. Open Orders and process order status stage-by-stage.
2. Open Slots and block or unblock non-operational dates.
3. Open Inventory and monitor low-stock warnings.
4. Open Reports for facility-only analytics and stage distribution.

### Operational Notes

1. Facility analytics is scoped to staff facility.
2. Processing transitions should follow state-machine rules.
3. Keep slot availability aligned with actual facility capacity.

## 4.3 Driver User Manual (Web and Mobile)

### Login

1. Open driver portal.
2. Enter mobile number.
3. Enter OTP and continue.

### Pickup and Delivery Tasks

1. Open pickup or delivery list.
2. Select assignment.
3. Update status in sequence until completed or failed.
4. Add notes where required.

### Driver Best Practices

1. Update status immediately at each milestone.
2. Use failed state only with valid reason.
3. Avoid skipping intermediate status updates.

## 4.4 Customer User Manual (Web and Mobile)

### Account Setup

1. Login with OTP.
2. Complete profile with valid name and optional email.
3. Add at least one address.

### Booking a Pickup

1. Go to Book screen.
2. Select pickup address.
3. Select date and slot.
4. Choose service type and optional express.
5. Add optional notes and submit.

### Tracking

1. Open Orders list.
2. Open specific order.
3. View status timeline until delivered.

### Customer Validation Notes

1. Name must be alphabetic with allowed punctuation.
2. Pincode must be 6 digits.
3. Booking cannot proceed without address and slot selection.
4. Service type must be one of backend-supported values.

---

## 5. Common Issues and Troubleshooting Guide

1. Backend root URL returns 404: expected, use /api endpoints.
2. OTP not received by SMS in beta: use temporary in-app OTP preview flow.
3. Empty or zero charts in reports: verify known contract mismatches between frontend mapping and backend payload shape.
4. Order creation fails for WASH_IRON: backend enum currently does not include this service type.
5. Facility report values look incomplete: validate payload contract before assuming data issue.

---

## 6. UAT Completion Checklist and Sign-off

| Checkpoint | Status |
|---|---|
| Role-wise login validated | Pending |
| Customer booking end-to-end validated | Pending |
| Facility processing flow validated | Pending |
| Driver pickup and delivery flow validated | Pending |
| Admin setup and master-data operations validated | Pending |
| Reporting outputs validated | Pending |
| Security and RBAC negative tests validated | Pending |
| Critical bugs triaged and retested | Pending |
| Client sign-off captured | Pending |

Sign-off Fields:
- Test Cycle: __________________
- Project Version: __________________
- QA Lead: __________________
- Product Owner: __________________
- Client Representative: __________________
- Final Decision: Pass / Conditional Pass / Fail
