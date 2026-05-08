# Quick test to check if backend is running
$maxAttempts = 10
$attempt = 0
$serverRunning = $false

Write-Host "Waiting for backend server to start..." -ForegroundColor Yellow

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -UseBasicParsing -ErrorAction Stop
        $serverRunning = $true
        Write-Host "Backend server is running!" -ForegroundColor Green
        break
    } catch {
        $attempt++
        Start-Sleep -Seconds 2
        Write-Host "Attempt $attempt/$maxAttempts - Server not ready yet..." -ForegroundColor Gray
    }
}

if ($serverRunning) {
    Write-Host "✓ Backend server is ready" -ForegroundColor Green
} else {
    Write-Host "✗ Backend server failed to start" -ForegroundColor Red
    Write-Host "Check the backend terminal for errors" -ForegroundColor Yellow
}
