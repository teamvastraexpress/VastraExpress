$root = $PSScriptRoot

$servers = @(
  @{ name = "Backend      (3000)"; path = "vastra-express-backend";     cmd = "npx prisma generate ; npm run start:dev" },
  @{ name = "Admin        (3001)"; path = "vastra-express-admin";        cmd = "npm run dev" },
  @{ name = "Facility     (3002)"; path = "vastra-express-facility";     cmd = "npm run dev" },
  @{ name = "Driver Web   (3003)"; path = "vastra-express-driver-web";   cmd = "npm run dev" },
  @{ name = "Customer Web (3004)"; path = "vastra-express-customer-web"; cmd = "npm run dev" }
)

foreach ($s in $servers) {
  $fullPath = Join-Path $root $s.path
  Start-Process powershell -WorkingDirectory $fullPath -ArgumentList "-NoExit", "-Command", $s.cmd -WindowStyle Normal
  Write-Host "✅ Started: $($s.name)"
  Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "All servers launched in separate windows."
Write-Host "  Backend      → http://localhost:3000/api"
Write-Host "  Admin        → http://localhost:3001"
Write-Host "  Facility     → http://localhost:3002"
Write-Host "  Driver Web   → http://localhost:3003"
Write-Host "  Customer Web → http://localhost:3004"
