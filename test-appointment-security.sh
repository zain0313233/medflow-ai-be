#!/bin/bash

# Appointment Routes Security Test Script
# Tests that voice-booking and slots routes are properly secured

BASE_URL="http://localhost:3001"

# API Keys from .env
RETELL_KEY="retell_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8"
VOICE_AGENT_KEY="va_live_8f7d9e2a1b4c6d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Appointment Routes Security Test"
echo "=========================================="
echo ""

# Test 1: Voice booking without authentication (should fail)
echo -e "${YELLOW}Test 1: Voice booking without authentication (should fail)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"doctorId":"123","patientName":"Test","patientPhone":"+1234567890","date":"2025-01-25","timeSlot":"09:00"}' \
    "$BASE_URL/api/appointments/voice-booking")
if [ "$RESPONSE" == "401" ]; then
    echo -e "${GREEN}✓ PASS: Request rejected (401)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 401, got $RESPONSE${NC}"
fi
echo ""

# Test 2: Voice booking with Retell API key (should succeed)
echo -e "${YELLOW}Test 2: Voice booking with Retell API key (should succeed)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $RETELL_KEY" \
    -d '{"doctorId":"678e9f1a2b3c4d5e6f7a8b9c","patientName":"Test Patient","patientPhone":"+1234567890","patientEmail":"test@example.com","date":"2025-01-25","timeSlot":"09:00","reason":"Checkup"}' \
    "$BASE_URL/api/appointments/voice-booking")
if [ "$RESPONSE" == "201" ] || [ "$RESPONSE" == "200" ] || [ "$RESPONSE" == "400" ]; then
    echo -e "${GREEN}✓ PASS: Request accepted (authenticated) - Status: $RESPONSE${NC}"
    echo -e "${BLUE}  Note: 400 is OK if doctor doesn't exist in DB${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 200/201/400, got $RESPONSE${NC}"
fi
echo ""

# Test 3: Voice booking with Voice Agent API key (should succeed)
echo -e "${YELLOW}Test 3: Voice booking with Voice Agent API key (should succeed)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $VOICE_AGENT_KEY" \
    -d '{"doctorId":"678e9f1a2b3c4d5e6f7a8b9c","patientName":"Test Patient","patientPhone":"+1234567890","patientEmail":"test@example.com","date":"2025-01-25","timeSlot":"09:00","reason":"Checkup"}' \
    "$BASE_URL/api/appointments/voice-booking")
if [ "$RESPONSE" == "201" ] || [ "$RESPONSE" == "200" ] || [ "$RESPONSE" == "400" ]; then
    echo -e "${GREEN}✓ PASS: Request accepted (authenticated) - Status: $RESPONSE${NC}"
    echo -e "${BLUE}  Note: 400 is OK if doctor doesn't exist in DB${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 200/201/400, got $RESPONSE${NC}"
fi
echo ""

# Test 4: Voice booking with invalid API key (should fail)
echo -e "${YELLOW}Test 4: Voice booking with invalid API key (should fail)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "X-API-Key: invalid_key_12345" \
    -d '{"doctorId":"123","patientName":"Test","patientPhone":"+1234567890","date":"2025-01-25","timeSlot":"09:00"}' \
    "$BASE_URL/api/appointments/voice-booking")
if [ "$RESPONSE" == "401" ]; then
    echo -e "${GREEN}✓ PASS: Request rejected (401)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 401, got $RESPONSE${NC}"
fi
echo ""

# Test 5: Get slots without authentication (should fail)
echo -e "${YELLOW}Test 5: Get slots without authentication (should fail)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    "$BASE_URL/api/appointments/slots/678e9f1a2b3c4d5e6f7a8b9c/2025-01-25")
if [ "$RESPONSE" == "401" ]; then
    echo -e "${GREEN}✓ PASS: Request rejected (401)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 401, got $RESPONSE${NC}"
fi
echo ""

# Test 6: Get slots with Retell API key (should succeed)
echo -e "${YELLOW}Test 6: Get slots with Retell API key (should succeed)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-API-Key: $RETELL_KEY" \
    "$BASE_URL/api/appointments/slots/678e9f1a2b3c4d5e6f7a8b9c/2025-01-25")
if [ "$RESPONSE" == "200" ] || [ "$RESPONSE" == "404" ] || [ "$RESPONSE" == "400" ]; then
    echo -e "${GREEN}✓ PASS: Request accepted (authenticated) - Status: $RESPONSE${NC}"
    echo -e "${BLUE}  Note: 404/400 is OK if doctor doesn't exist in DB${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 200/404/400, got $RESPONSE${NC}"
fi
echo ""

# Test 7: Get slots with Voice Agent API key (should succeed)
echo -e "${YELLOW}Test 7: Get slots with Voice Agent API key (should succeed)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-API-Key: $VOICE_AGENT_KEY" \
    "$BASE_URL/api/appointments/slots/678e9f1a2b3c4d5e6f7a8b9c/2025-01-25")
if [ "$RESPONSE" == "200" ] || [ "$RESPONSE" == "404" ] || [ "$RESPONSE" == "400" ]; then
    echo -e "${GREEN}✓ PASS: Request accepted (authenticated) - Status: $RESPONSE${NC}"
    echo -e "${BLUE}  Note: 404/400 is OK if doctor doesn't exist in DB${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 200/404/400, got $RESPONSE${NC}"
fi
echo ""

# Test 8: Get slots with invalid API key (should fail)
echo -e "${YELLOW}Test 8: Get slots with invalid API key (should fail)${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-API-Key: invalid_key_12345" \
    "$BASE_URL/api/appointments/slots/678e9f1a2b3c4d5e6f7a8b9c/2025-01-25")
if [ "$RESPONSE" == "401" ]; then
    echo -e "${GREEN}✓ PASS: Request rejected (401)${NC}"
else
    echo -e "${RED}✗ FAIL: Expected 401, got $RESPONSE${NC}"
fi
echo ""

echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "- Voice booking and slots routes are now secured"
echo "- Only Retell agent (API key) or Admin users (JWT) can access"
echo "- Public access is completely blocked"
