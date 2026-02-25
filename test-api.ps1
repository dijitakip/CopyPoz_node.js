# CopyPoz V5 - API Testing Script (PowerShell)
# Bu script tüm API endpoints'lerini test eder

$BASE_URL = "http://localhost:3000"
$MASTER_TOKEN = "master-local-123"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CopyPoz V5 - API Testing" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$PASSED = 0
$FAILED = 0

# Test function
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Data,
        [int]$ExpectedCode
    )
    
    Write-Host -NoNewline "Testing $Method $Endpoint ... "
    
    try {
        $headers = @{
            "Authorization" = "Bearer $MASTER_TOKEN"
            "Content-Type" = "application/json"
        }
        
        if ($Data) {
            $response = Invoke-WebRequest -Uri "$BASE_URL$Endpoint" `
                -Method $Method `
                -Headers $headers `
                -Body $Data `
                -ErrorAction SilentlyContinue
        } else {
            $response = Invoke-WebRequest -Uri "$BASE_URL$Endpoint" `
                -Method $Method `
                -Headers $headers `
                -ErrorAction SilentlyContinue
        }
        
        $httpCode = $response.StatusCode
        
        if ($httpCode -eq $ExpectedCode) {
            Write-Host "✓ PASSED (HTTP $httpCode)" -ForegroundColor Green
            $script:PASSED++
        } else {
            Write-Host "✗ FAILED (Expected $ExpectedCode, got $httpCode)" -ForegroundColor Red
            $script:FAILED++
        }
    } catch {
        $httpCode = $_.Exception.Response.StatusCode.Value__
        if ($httpCode -eq $ExpectedCode) {
            Write-Host "✓ PASSED (HTTP $httpCode)" -ForegroundColor Green
            $script:PASSED++
        } else {
            Write-Host "✗ FAILED (Expected $ExpectedCode, got $httpCode)" -ForegroundColor Red
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:FAILED++
        }
    }
    Write-Host ""
}

# 1. Health Check
Write-Host "1. Health Check" -ForegroundColor Yellow
Test-Endpoint "GET" "/api/health" "" 200

# 2. Login
Write-Host "2. Authentication" -ForegroundColor Yellow
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json
Test-Endpoint "POST" "/api/auth/login" $loginData 200

# 3. Users
Write-Host "3. User Management" -ForegroundColor Yellow
Test-Endpoint "GET" "/api/users" "" 200

# 4. Clients
Write-Host "4. Client Management" -ForegroundColor Yellow
Test-Endpoint "GET" "/api/clients" "" 200

# 5. Commands
Write-Host "5. Command Management" -ForegroundColor Yellow
Test-Endpoint "GET" "/api/commands" "" 200

# 6. Master Groups
Write-Host "6. Master Groups" -ForegroundColor Yellow
Test-Endpoint "GET" "/api/master-groups" "" 200

# 7. Tokens
Write-Host "7. Token Management" -ForegroundColor Yellow
Test-Endpoint "GET" "/api/tokens" "" 200

# 8. Licenses
Write-Host "8. License Management" -ForegroundColor Yellow
Test-Endpoint "GET" "/api/licenses" "" 200

# 9. Logs
Write-Host "9. System Logs" -ForegroundColor Yellow
Test-Endpoint "GET" "/api/logs" "" 200

# 10. Master State
Write-Host "10. Master State" -ForegroundColor Yellow
Test-Endpoint "GET" "/api/master/state" "" 200

# 11. Positions
Write-Host "11. Positions" -ForegroundColor Yellow
Test-Endpoint "GET" "/api/positions" "" 200

# 12. Client Heartbeat
Write-Host "12. Client Heartbeat" -ForegroundColor Yellow
$heartbeatData = @{
    account_number = 12345
    account_name = "Test"
    balance = 10000
    equity = 10000
    open_positions = 0
} | ConvertTo-Json
Test-Endpoint "POST" "/api/client/heartbeat" $heartbeatData 200

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Results: " -NoNewline
Write-Host "$PASSED passed" -ForegroundColor Green -NoNewline
Write-Host ", " -NoNewline
Write-Host "$FAILED failed" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Cyan

if ($FAILED -eq 0) {
    exit 0
} else {
    exit 1
}
