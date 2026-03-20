#!/bin/bash
# System Health Check Script
# Usage: bash test-system.sh

BASE_URL="https://ecommerce-backend-r75w.onrender.com/api"

echo "=========================================="
echo "   E-commerce System Health Check"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local expected_status=$4
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
        status=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
    elif [ "$method" = "POST" ]; then
        local data=$5
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
        status=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
    fi
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (Status: $status)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
        echo "  Response: $body" | head -c 200
        echo ""
        return 1
    fi
}

failed=0

# Public endpoints
echo "=== Public Endpoints ==="
test_endpoint "Get Categories" "GET" "$BASE_URL/categories" "200"
test_endpoint "Get Settings" "GET" "$BASE_URL/settings/public" "200"
test_endpoint "Get Featured Products" "GET" "$BASE_URL/products/public?isFeatured=true&limit=12" "200"
test_endpoint "Get BCV Rate" "GET" "$BASE_URL/bcv" "200"
test_endpoint "Login (invalid)" "POST" "$BASE_URL/auth/login" "401" '{"email":"test@test.com","password":"wrong"}'
echo ""

# Authenticated endpoints (need a valid token)
echo "=== Authenticated Endpoints ==="
# You'll need to replace TOKEN with an actual token
TOKEN="${TOKEN:-}"

if [ -n "$TOKEN" ]; then
    test_endpoint "Get User Profile" "GET" "$BASE_URL/auth/me" "200" "" "-H \"Authorization: Bearer $TOKEN\""
    test_endpoint "Get Favorites" "GET" "$BASE_URL/favorites" "200"
    test_endpoint "Get Notifications" "GET" "$BASE_URL/notifications/unread" "200"
    test_endpoint "Get Cart" "GET" "$BASE_URL/cart" "200"
else
    echo -e "${YELLOW}⚠ No TOKEN provided, skipping authenticated tests${NC}"
    echo "   Set TOKEN env var: export TOKEN=your_jwt_token"
fi
echo ""

# Admin endpoints (need admin token)
echo "=== Admin Endpoints ==="
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

if [ -n "$ADMIN_TOKEN" ]; then
    test_endpoint "Admin Stats" "GET" "$BASE_URL/admin/stats" "200"
    test_endpoint "Admin Products" "GET" "$BASE_URL/admin/products" "200"
    test_endpoint "Admin Categories" "GET" "$BASE_URL/admin/categories" "200"
    test_endpoint "Admin BCV Status" "GET" "$BASE_URL/admin/bcv/status" "200"
else
    echo -e "${YELLOW}⚠ No ADMIN_TOKEN provided, skipping admin tests${NC}"
    echo "   Set ADMIN_TOKEN env var: export ADMIN_TOKEN=your_admin_jwt_token"
fi
echo ""

# Summary
echo "=========================================="
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
else
    echo -e "${RED}Some tests failed${NC}"
fi
echo "=========================================="
