# Vastra Express - Testing Setup Complete ✅

## Project Status
**All services running successfully on localhost**

### Core Services Running
- ✅ **Backend API** → http://localhost:3000/api
- ✅ **Admin Panel** → http://localhost:3001
- ✅ **Facility Portal** → http://localhost:3002
- ✅ **Driver Web App** → http://localhost:3003
- ✅ **Customer Web App** → http://localhost:3004

### Database
- ✅ **MySQL** (XAMPP) running on localhost:3306
- ✅ **Database** `vastra_express_dev` created
- ✅ **Schema** 6 migrations applied successfully

---

## Test Data Available

### Pickup Slots (Today - 2026-05-12)
All slots available for booking:

| Time Slot | Duration | Capacity | Status |
|-----------|----------|----------|--------|
| 09:00 - 12:00 | 3 hours | 20 | ✅ Active |
| 14:00 - 17:00 | 3 hours | 20 | ✅ Active |
| 18:00 - 21:00 | 3 hours | 20 | ✅ Active |
| 21:00 - 23:59 | 3 hours | 15 | ✅ Active |

---

## Test User Accounts

### Admin
- **Role**: Admin (Full Access)
- **Username**: `admin`
- **Password**: `password`
- **Access**: Admin Panel (http://localhost:3001)

### Facility Staff
| Name | Mobile | Email | Facility | Status |
|------|--------|-------|----------|--------|
| Raj Kumar | 9000000001 | raj@facility.com | Joy Johnson kujur | ✅ Active |
| Priya Singh | 9000000002 | priya@facility.com | Joy Johnson kujur | ✅ Active |

**Note**: First login requires OTP change. Use credentials shared at account setup.

### Drivers
| Name | Mobile | Email | Status |
|------|--------|-------|--------|
| Arjun Patel | 9111111111 | arjun@driver.com | ✅ Active |
| Mohit Sharma | 9111111112 | mohit@driver.com | ✅ Active |
| Vikram Singh | 9111111113 | vikram@driver.com | ✅ Active |

### Customers
| Name | Mobile | Email | Status |
|------|--------|-------|--------|
| kujur sir | 9876567890 | - | ✅ Active |
| Test Customer A | 9333333331 | testA@test.com | Ready |
| Test Customer B | 9333333332 | testB@test.com | Ready |
| Test Customer C | 9333333333 | testC@test.com | Ready |

---

## Testing Scenarios

### Scenario 1: Customer Order Booking
1. **Navigate**: http://localhost:3004 (Customer Web)
2. **Login**: Mobile: `9876567890`, OTP: `123456`
3. **Book Order**:
   - Select service type: WASH_FOLD, DRY_CLEAN, or IRON_ONLY
   - Choose pickup slot (09:00-12:00, 14:00-17:00, etc.)
   - Confirm pickup address
   - Submit order

### Scenario 2: Admin Order Management
1. **Login**: http://localhost:3001 → admin / password
2. **View Orders**: Manage all orders, assign to drivers
3. **Manage Slots**: Add, edit, or block pickup slots
4. **View Reports**: Real-time analytics and KPIs

### Scenario 3: Facility Staff Portal
1. **Login**: http://localhost:3002
2. **Mobile**: 9000000001 (Raj Kumar)
3. **Password**: OTP sent to email during account setup
4. **Access**:
   - View facility inventory
   - Manage pickup operations
   - Track assigned orders
   - Update order status

### Scenario 4: Driver Delivery Operations
1. **Login**: http://localhost:3003 (Driver Web)
2. **Mobile**: 9111111111 (Arjun Patel)
3. **Password**: OTP from setup
4. **Operations**:
   - View assigned pickups/deliveries
   - Update delivery status
   - Track location
   - Accept/reject assignments

---

## API Documentation
- **Swagger Docs**: http://localhost:3000/api/docs
- **API Base**: http://localhost:3000/api
- **Default JWT expires in**: 7 days

### Common Endpoints
```
POST   /auth/admin-login           → Admin login
POST   /auth/send-otp              → Send OTP to customer
POST   /auth/verify-otp            → Verify OTP and get JWT
GET    /pickup-slots               → List available slots
POST   /orders                     → Create order
GET    /orders                     → List orders
PATCH  /orders/:id/status          → Update order status
POST   /delivery/assign            → Assign driver
GET    /delivery/my-assignments    → Driver's assignments
```

---

## Service Types Available
- **WASH_FOLD**: Regular washing and folding (₹80/kg base)
- **DRY_CLEAN**: Dry cleaning service (₹150/kg base)
- **IRON_ONLY**: Ironing only service (₹50/kg base)

---

## Quick Start for Testing

### Test 1: Book an Order (5 minutes)
```bash
1. Visit http://localhost:3004
2. Login with mobile: 9876567890, OTP: 123456
3. Create order with any service type
4. Select slot: 09:00-12:00 or 14:00-17:00
5. Confirm booking
```

### Test 2: View Admin Dashboard (2 minutes)
```bash
1. Visit http://localhost:3001
2. Login: admin / password
3. Check Dashboard → Orders, Slots, Reports
4. Navigate to Users & Staff tab
5. View Pickup Slots page
```

### Test 3: Facility Operations (5 minutes)
```bash
1. Visit http://localhost:3002
2. Login: 9000000001 (Raj Kumar)
3. Use OTP sent to email
4. Change password if needed
5. View facility dashboard
```

---

## Troubleshooting

### Issue: OTP not working in customer app
**Solution**: In dev mode, test OTP is `123456`. Use this for verification.

### Issue: Slots not showing in booking
**Solution**: 
- Refresh the page
- Check admin panel to verify slots are active
- Verify facility is active

### Issue: Orders not creating
**Solution**:
- Ensure customer has valid address
- Verify slot exists and has capacity
- Check backend logs for detailed error

### Issue: Backend API not responding
**Solution**:
```bash
# Check if MySQL is running
netstat -ano | Select-String ':3306'

# Restart backend
cd vastra-express-backend
npm run start:dev
```

---

## Files & Configurations

### Key Files
- **Backend Env**: `vastra-express-backend/.env`
- **Database URL**: `mysql://root@localhost:3306/vastra_express_dev`
- **Seed Script**: `seed-test-data.ps1`
- **Run Script**: `start-all.ps1`

### Environment Variables (Backend)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://root@localhost:3306/vastra_express_dev
JWT_SECRET=<auto-generated>
```

---

## Next Steps

1. **Create More Test Orders**:
   ```powershell
   Set-Location vastra-express-backend
   node scripts/seed-pricing.mjs  # Seed pricing data
   ```

2. **Run Full Integration Test**:
   - Book order as customer
   - Assign to driver in admin
   - Update status through driver app
   - Track completion in facility portal

3. **Performance Testing**:
   - Load test pickup slots endpoint
   - Test concurrent order creation
   - Monitor database query performance

---

## Support & Documentation

- 📖 **Implementation Guide**: `IMPLEMENTATION_GUIDE.md`
- 📋 **Test Cases**: `DOC_PACK_2_TEST_CASES_USER_MANUAL.md`
- 🔐 **Firebase Setup**: `FIREBASE_SETUP_GUIDE.md`
- 🏗️  **System Architecture**: `SYSTEM_PRESENTATION_DOCUMENT.md`
- 📊 **Reports**: `V2_MIGRATION_GUIDE.md`

---

## Success Checklist ✅

- ✅ All 5 services running
- ✅ MySQL database connected
- ✅ Admin panel accessible
- ✅ 4 pickup slots created for today
- ✅ 9 test users created (admin, staff, drivers, customers)
- ✅ API responding on all endpoints
- ✅ Swagger docs accessible

**Ready for testing!** 🚀
