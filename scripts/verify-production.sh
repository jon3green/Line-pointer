#!/bin/bash

# Production Verification Script
# Tests all major features and caching

echo "🏈 Line Pointer - Production Verification"
echo "=========================================="
echo ""

PROD_URL="https://line-pointer.vercel.app"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing $name... "
    response=$(curl -s -w "\n%{http_code}" "$url")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "200" ]; then
        if echo "$body" | grep -q "$expected"; then
            echo -e "${GREEN}✅ PASS${NC} (${status_code})"
            return 0
        else
            echo -e "${YELLOW}⚠️  WARNING${NC} - Got 200 but unexpected response"
            echo "   Expected to find: $expected"
            echo "   Got: $(echo "$body" | head -c 100)..."
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL${NC} (${status_code})"
        echo "   Response: $(echo "$body" | head -c 200)"
        return 1
    fi
}

# Test timing function
test_cache_performance() {
    local name=$1
    local url=$2
    
    echo ""
    echo "Testing $name cache performance..."
    
    echo -n "  Request 1 (cache miss): "
    time1=$(curl -s -o /dev/null -w "%{time_total}" "$url")
    echo "${time1}s"
    
    sleep 1
    
    echo -n "  Request 2 (cached):     "
    time2=$(curl -s -o /dev/null -w "%{time_total}" "$url")
    echo "${time2}s"
    
    # Calculate speedup
    speedup=$(echo "scale=2; $time1 / $time2" | bc 2>/dev/null || echo "N/A")
    
    if [ "$speedup" != "N/A" ] && [ "$(echo "$speedup > 1.5" | bc)" -eq 1 ]; then
        echo -e "  ${GREEN}✅ Caching working!${NC} (${speedup}x faster)"
    else
        echo -e "  ${YELLOW}⚠️  Caching may not be active${NC}"
    fi
}

echo "1️⃣  Basic Connectivity Tests"
echo "─────────────────────────────"
test_endpoint "Homepage" "$PROD_URL" "Line Pointer"
test_endpoint "Players Page" "$PROD_URL/players" "Player Stats"
test_endpoint "Dashboard" "$PROD_URL/dashboard" "dashboard"

echo ""
echo "2️⃣  API Endpoint Tests"
echo "─────────────────────────────"
test_endpoint "Game Odds API" "$PROD_URL/api/games/odds?sport=nfl" "success"
test_endpoint "Player Props API" "$PROD_URL/api/props/odds?sport=nfl" "success"
test_endpoint "ESPN Players API" "$PROD_URL/api/players/espn?sport=nfl&limit=5" "success"

echo ""
echo "3️⃣  Caching Performance Tests"
echo "─────────────────────────────"
test_cache_performance "Game Odds" "$PROD_URL/api/games/odds?sport=nfl"

echo ""
echo "4️⃣  Feature Tests"
echo "─────────────────────────────"
test_endpoint "Authentication" "$PROD_URL/auth/signin" "Sign in"
test_endpoint "Signup" "$PROD_URL/auth/signup" "Create Account"

echo ""
echo "=========================================="
echo "Verification Complete!"
echo ""
echo "📊 Summary:"
echo "  - If all tests pass: ✅ Production is healthy"
echo "  - If API tests fail: Check environment variables"
echo "  - If cache tests show no improvement: Verify Vercel KV is connected"
echo ""
echo "📝 Next Steps:"
echo "  1. Fix any failed tests"
echo "  2. Monitor logs: vercel logs $PROD_URL --follow"
echo "  3. Check Vercel dashboard for errors"
echo ""

