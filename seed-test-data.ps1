# Seed test data for Vastra Express
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJBRE1JTiIsIm1vYmlsZSI6IjAwMDAwMDAwMDAiLCJpYXQiOjE3Nzg1OTI0NjcsImV4cCI6MTc3OTE5NzI2N30.jO9GWl38aRxt0SoT2XgefRBbBG97o15zw6T5FsuW69g"
$headers = @{ 'Content-Type' = 'application/json'; 'Authorization' = "Bearer $token" }
$base = 'http://localhost:3000/api'

Write-Host "========================================" -ForegroundColor Green
Write-Host "  VASTRA EXPRESS - TEST DATA SEEDING  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Create additional time slots
Write-Host "" 
Write-Host "Creating additional pickup slots..." -ForegroundColor Cyan
$slots = @(
    @{ facilityId=1; slotDate='2026-05-12'; startTime='18:00'; endTime='21:00'; maxCapacity=20 },
    @{ facilityId=1; slotDate='2026-05-12'; startTime='21:00'; endTime='23:59'; maxCapacity=15 }
)
foreach ($slot in $slots) {
    try {
        $r = Invoke-WebRequest -Uri "$base/pickup-slots" -Method POST -Body ($slot | ConvertTo-Json) -Headers $headers -UseBasicParsing -ErrorAction Stop
        Write-Host "OK: Slot $($slot.startTime)-$($slot.endTime)" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Create facility staff
Write-Host ""
Write-Host "Creating facility staff users..." -ForegroundColor Cyan
$staffUsers = @(
    @{ name='Raj Kumar'; mobileNumber='9000000101'; email='raj@facility.com'; role='FACILITY_STAFF'; facilityId=1 },
    @{ name='Priya Singh'; mobileNumber='9000000102'; email='priya@facility.com'; role='FACILITY_STAFF'; facilityId=1 }
)
foreach ($staff in $staffUsers) {
    try {
        $r = Invoke-WebRequest -Uri "$base/users" -Method POST -Body ($staff | ConvertTo-Json) -Headers $headers -UseBasicParsing -ErrorAction Stop | ConvertFrom-Json
        Write-Host "OK: $($staff.name) ID=$($r.id)" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: $($staff.name) error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Create drivers
Write-Host ""
Write-Host "Creating driver users..." -ForegroundColor Cyan
$drivers = @(
    @{ name='Arjun Patel'; mobileNumber='9111111111'; email='arjun@driver.com'; role='DRIVER' },
    @{ name='Mohit Sharma'; mobileNumber='9111111112'; email='mohit@driver.com'; role='DRIVER' },
    @{ name='Vikram Singh'; mobileNumber='9111111113'; email='vikram@driver.com'; role='DRIVER' }
)
$driverIds = @()
foreach ($driver in $drivers) {
    try {
        $r = Invoke-WebRequest -Uri "$base/users" -Method POST -Body ($driver | ConvertTo-Json) -Headers $headers -UseBasicParsing -ErrorAction Stop | ConvertFrom-Json
        $driverIds += $r.id
        Write-Host "OK: $($driver.name) ID=$($r.id)" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: $($driver.name) error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Create customers with addresses
Write-Host ""
Write-Host "Creating customers with addresses..." -ForegroundColor Cyan
$customers = @(
    @{ name='Rahul Sharma'; mobileNumber='9222222222'; email='rahul@customer.com' },
    @{ name='Anjali Gupta'; mobileNumber='9222222223'; email='anjali@customer.com' },
    @{ name='Neha Verma'; mobileNumber='9222222224'; email='neha@customer.com' }
)
$customerIds = @()
$addressIds = @()

foreach ($customer in $customers) {
    try {
        $sendOtpBody = @{ mobileNumber=$customer.mobileNumber; name=$customer.name; email=$customer.email } | ConvertTo-Json
        $r = Invoke-WebRequest -Uri "$base/auth/send-otp" -Method POST -Body $sendOtpBody -Headers $headers -UseBasicParsing -ErrorAction Stop
        Write-Host "OK: Registered $($customer.name)" -ForegroundColor Green
        
        # Verify OTP (default test OTP: 123456)
        $verifyBody = @{
            mobileNumber=$customer.mobileNumber
            name=$customer.name
            email=$customer.email
            otp='123456'
            role='CUSTOMER'
            password='Test@1234'
        } | ConvertTo-Json
        
        $vr = Invoke-WebRequest -Uri "$base/auth/verify-otp" -Method POST -Body $verifyBody -Headers $headers -UseBasicParsing -ErrorAction Stop | ConvertFrom-Json
        $cId = $vr.user.id
        $customerIds += $cId
        Write-Host "   Verified ID=$cId" -ForegroundColor Green
        
        # Create address
        $addressBody = @{
            houseFlatNo="Apt-$(Get-Random -Minimum 100 -Maximum 999)"
            street="MG Road"
            landmark="Near Tech Park"
            pincode="400001"
            cityId=1
            latitude=19.0760
            longitude=72.8777
            isDefault=$true
        } | ConvertTo-Json
        
        $ar = Invoke-WebRequest -Uri "$base/addresses" -Method POST -Body $addressBody -Headers $headers -UseBasicParsing -ErrorAction Stop | ConvertFrom-Json
        $addressIds += $ar.id
        Write-Host "   Address created ID=$($ar.id)" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: $($customer.name) error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Create orders for testing
Write-Host ""
Write-Host "Creating test orders..." -ForegroundColor Cyan
$serviceTypes = @('WASH_FOLD', 'DRY_CLEAN', 'IRON_ONLY')
$orderCounter = 0

if ($customerIds.Count -gt 0 -and $addressIds.Count -gt 0) {
    for ($i = 0; $i -lt 8; $i++) {
        try {
            $custIdx = $i % $customerIds.Count
            $addrIdx = $i % $addressIds.Count
            $serviceType = $serviceTypes[$i % $serviceTypes.Count]
            $slotId = ($i % 5) + 1
            
            $orderBody = @{
                serviceType=$serviceType
                addressId=$addressIds[$addrIdx]
                slotId=$slotId
                weight = 2 + ($i % 4)
                customerNotes="Test order for $serviceType"
                facilityId=1
            } | ConvertTo-Json
            
            $or = Invoke-WebRequest -Uri "$base/orders" -Method POST -Body $orderBody -Headers $headers -UseBasicParsing -ErrorAction Stop | ConvertFrom-Json
            $orderCounter++
            Write-Host "OK: Order $($or.id) - $serviceType Status=$($or.status)" -ForegroundColor Green
        } catch {
            Write-Host "FAIL: Order creation error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SEEDING COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Customers: $($customerIds.Count)" -ForegroundColor Green
Write-Host "Drivers: $($driverIds.Count)" -ForegroundColor Green
Write-Host "Orders: $orderCounter" -ForegroundColor Green
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Yellow
Write-Host "Customer: 9222222222, OTP: 123456, Password: Test@1234" -ForegroundColor Gray
Write-Host "Customer: 9222222223, OTP: 123456, Password: Test@1234" -ForegroundColor Gray
Write-Host "Customer: 9222222224, OTP: 123456, Password: Test@1234" -ForegroundColor Gray
