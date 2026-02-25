# Quick API Test
$BASE_URL = "http://localhost:3000"
$MASTER_TOKEN = "master-local-123"

Write-Host "Testing CopyPoz V5 API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health
Write-Host "1. Health Check: " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/health" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ OK" -ForegroundColor Green
} catch {
    Write-Host "✗ FAILED" -ForegroundColor Red
}

# Test 2: Clients
Write-Host "2. Clients API: " -NoNewline
try {
    $headers = @{ "Authorization" = "Bearer $MASTER_TOKEN" }
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/clients" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ OK" -ForegroundColor Green
} catch {
    Write-Host "✗ FAILED" -ForegroundColor Red
}

# Test 3: Users
Write-Host "3. Users API: " -NoNewline
try {
    $headers = @{ "Authorization" = "Bearer $MASTER_TOKEN" }
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/users" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ OK" -ForegroundColor Green
} catch {
    Write-Host "✗ FAILED" -ForegroundColor Red
}

# Test 4: Dashboard
Write-Host "4. Dashboard: " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/dashboard" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ OK" -ForegroundColor Green
} catch {
    Write-Host "✗ FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Cyan
