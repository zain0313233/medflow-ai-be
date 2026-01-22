#!/bin/bash

# API Security Test Script
# Tests API key authentication and signature verification

BASE_URL="http://localhost:3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "API Security Test Suite"
echo "=========================================="
echo ""

# Test 1: Voice Agent without API key (should fail)
echo -e "${YELLOW}Test 1: Voice Agent without API key (should fail)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/voice-agent/doctors")
if [ "$RESPONSE" == "401" ]; then
    echo -e "${GREEN}✓ PASS: Request rejected (401)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 401, got $RESPONSE${NC}"
fi
echo ""

# Test 2: Voice Agent with valid API key (should succeed)
echo -e "${YELLOW}Test 2: Voice Agent with valid API key (should succeed)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-API-Key: va_live_8f7d9e2a1b4c6d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2" \
    "$BASE_URL/api/voice-agent/doctors")
if [ "$RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓ PASS: Request accepted (200)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 200, got $RESPONSE${NC}"
fi
echo ""

# Test 3: Voice Agent with invalid API key (should fail)
echo -e "${YELLOW}Test 3: Voice Agent with invalid API key (should fail)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-API-Key: invalid_key_12345" \
    "$BASE_URL/api/voice-agent/doctors")
if [ "$RESPONSE" == "403" ]; then
    echo -e "${GREEN}✓ PASS: Request rejected (403)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 403, got $RESPONSE${NC}"
fi
echo ""

# Test 4: Webhook without API key (should fail)
echo -e "${YELLOW}Test 4: Webhook without API key (should fail)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}' \
    "$BASE_URL/api/webhook/test")
if [ "$RESPONSE" == "401" ]; then
    echo -e "${GREEN}✓ PASS: Request rejected (401)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 401, got $RESPONSE${NC}"
fi
echo ""

# Test 5: Webhook with valid API key (should succeed)
echo -e "${YELLOW}Test 5: Webhook with valid API key (should succeed)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "X-API-Key: webhook_live_2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3" \
    -d '{"test": "data"}' \
    "$BASE_URL/api/webhook/test")
if [ "$RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓ PASS: Request accepted (200)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 200, got $RESPONSE${NC}"
fi
echo ""

# Test 6: Retail AI call endpoint without JWT (should fail)
echo -e "${YELLOW}Test 6: Retail AI call endpoint without JWT (should fail)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber": "+1234567890"}' \
    "$BASE_URL/api/retail-ai/call")
if [ "$RESPONSE" == "401" ]; then
    echo -e "${GREEN}✓ PASS: Request rejected (401)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 401, got $RESPONSE${NC}"
fi
echo ""

# Test 7: Retell functions without API key (should fail)
echo -e "${YELLOW}Test 7: Retell functions without API key (should fail)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"doctorId": "123", "date": "2025-01-25"}' \
    "$BASE_URL/api/retell/check-availability")
if [ "$RESPONSE" == "401" ]; then
    echo -e "${GREEN}✓ PASS: Request rejected (401)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 401, got $RESPONSE${NC}"
fi
echo ""

# Test 8: Health check endpoints (should be public)
echo -e "${YELLOW}Test 8: Health check endpoints (should be public)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/webhook/health")
if [ "$RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓ PASS: Health check accessible (200)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 200, got $RESPONSE${NC}"
fi
echo ""

echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="
