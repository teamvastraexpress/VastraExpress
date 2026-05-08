# Vastra Express - Facility Allocator Test
# Tests the facility allocation endpoint with real data
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  FACILITY ALLOCATOR TEST" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api"

# Test 1: Get Facility Options
Write-Host "[1/1] Testing Facility Allocator Endpoint..." -ForegroundColor Yellow
Write-Host "  Endpoint: GET /facility-allocator/options" -ForegroundColor Gray
Write-Host "  Query: ?addressId=1&pickupDate=2025-01-20" -ForegroundColor Gray
Write-Host ""

try {
    # Note: This requires a valid JWT token in the Authorization header
    # Get your token from login response first
    $headers = @{
        "Authorization" = "Bearer YOUR_JWT_TOKEN_HERE"
        "Content-Type" = "application/json"
    }
    
    $url = "$baseUrl/facility-allocator/options?addressId=1&pickupDate=2025-01-20"
    Write-Host "  Calling: $url" -ForegroundColor Gray
    Write-Host "  NOTE: You need to replace YOUR_JWT_TOKEN_HERE with a valid token from login" -ForegroundColor Yellow
    Write-Host ""
    
    $response = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Response:" -ForegroundColor Green
    Write-Host ($data | ConvertTo-Json -Depth 3) -ForegroundColor Cyan
    Write-Host ""
    Write-Host "ALLOCATOR TEST PASSED" -ForegroundColor Green
    
} catch {
    Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Ensure backend server is running: npm run start:dev" -ForegroundColor Gray
    Write-Host "  2. Get a JWT token by logging in first" -ForegroundColor Gray
    Write-Host "  3. Replace YOUR_JWT_TOKEN_HERE with the actual token" -ForegroundColor Gray
    Write-Host "  4. Verify addressId=1 exists in database" -ForegroundColor Gray
    Write-Host "  5. Verify facilities exist in database" -ForegroundColor Gray
}
