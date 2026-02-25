#!/bin/bash

# CopyPoz V5 - API Testing Script
# Bu script tüm API endpoints'lerini test eder

BASE_URL="http://localhost:3000"
MASTER_TOKEN="master-local-123"

echo "=========================================="
echo "CopyPoz V5 - API Testing"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_code=$4
    
    echo -n "Testing $method $endpoint ... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Authorization: Bearer $MASTER_TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Authorization: Bearer $MASTER_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# 1. Health Check
echo -e "${YELLOW}1. Health Check${NC}"
test_endpoint "GET" "/api/health" "" "200"

# 2. Login
echo -e "${YELLOW}2. Authentication${NC}"
test_endpoint "POST" "/api/auth/login" \
    '{"username":"admin","password":"admin123"}' "200"

# 3. Users
echo -e "${YELLOW}3. User Management${NC}"
test_endpoint "GET" "/api/users" "" "200"

# 4. Clients
echo -e "${YELLOW}4. Client Management${NC}"
test_endpoint "GET" "/api/clients" "" "200"

# 5. Commands
echo -e "${YELLOW}5. Command Management${NC}"
test_endpoint "GET" "/api/commands" "" "200"

# 6. Master Groups
echo -e "${YELLOW}6. Master Groups${NC}"
test_endpoint "GET" "/api/master-groups" "" "200"

# 7. Tokens
echo -e "${YELLOW}7. Token Management${NC}"
test_endpoint "GET" "/api/tokens" "" "200"

# 8. Licenses
echo -e "${YELLOW}8. License Management${NC}"
test_endpoint "GET" "/api/licenses" "" "200"

# 9. Logs
echo -e "${YELLOW}9. System Logs${NC}"
test_endpoint "GET" "/api/logs" "" "200"

# 10. Master State
echo -e "${YELLOW}10. Master State${NC}"
test_endpoint "GET" "/api/master/state" "" "200"

# 11. Positions
echo -e "${YELLOW}11. Positions${NC}"
test_endpoint "GET" "/api/positions" "" "200"

# 12. Client Heartbeat
echo -e "${YELLOW}12. Client Heartbeat${NC}"
test_endpoint "POST" "/api/client/heartbeat" \
    '{"account_number":12345,"account_name":"Test","balance":10000,"equity":10000,"open_positions":0}' "200"

# Summary
echo "=========================================="
echo -e "Test Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
