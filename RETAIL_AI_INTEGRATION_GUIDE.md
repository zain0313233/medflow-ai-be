# 🤖 Retail AI Agent Integration Guide

## The Problem You Asked About

**Question:** "When I click on microphone, it's not making a call to my agent like in Retail AI dashboard. It's calling health API. Which API in my backend calls our voice agent?"

**Answer:** You need to call these specific APIs to interact with your Retail AI agent `agent_41b2fe861b141729747b0c151d`.

## 🎯 APIs That Actually Call Your Voice Agent

### 1. **Trigger Phone Call (Like Retail AI Dashboard)**
```
POST http://localhost:3001/api/retail-ai/call
```
**Body:**
```json
{
  "phoneNumber": "+1234567890",
  "customerName": "John Doe"
}
```
**This does:** Makes your agent call a phone number (exactly like clicking "Test Call" in Retail AI dashboard)

### 2. **Process Microphone Audio**
```
POST http://localhost:3001/api/retail-ai/audio
```
**Body:**
```json
{
  "audioData": "base64_encoded_audio_data",
  "format": "webm"
}
```
**This does:** Sends microphone audio to your agent for processing

### 3. **Start Web Conversation**
```
POST http://localhost:3001/api/retail-ai/session
```
**Body:**
```json
{
  "sessionType": "web_audio"
}
```
**This does:** Starts a web-based conversation with your agent

### 4. **Test Agent Connection**
```
GET http://localhost:3001/api/retail-ai/test
```
**This does:** Tests if your agent is reachable and working

### 5. **Get Agent Status**
```
GET http://localhost:3001/api/retail-ai/status
```
**This does:** Gets your agent's current status and configuration

## 🔧 How to Fix Your Microphone Button

### Current Problem:
Your microphone button calls:
```javascript
// ❌ This only checks if backend is running
await fetch('/api/voice-agent/health')
```

### Solution:
Your microphone button should call:
```javascript
// ✅ This actually processes audio with your agent
await fetch('/api/retail-ai/audio', {
  method: 'POST',
  body: JSON.stringify({
    audioData: base64Audio,
    format: 'webm'
  })
})
```

## 🧪 Test Your Integration

### Step 1: Start Your Backend
```bash
cd medflow-ai-be
npm run dev
```

### Step 2: Open Test Page
Open this file in your browser:
```
medflow-ai-be/test-retail-ai-integration.html
```

### Step 3: Test Each API
1. **Test Agent Connection** - Verify your agent is reachable
2. **Get Agent Status** - Check if agent is active
3. **Trigger Phone Call** - Make your agent call a number
4. **Process Web Audio** - Test microphone audio processing
5. **Start Web Session** - Test web conversation

## 📱 Frontend Integration

### Update Your VoiceAgent Component

Replace the health API call with the actual agent API:

```typescript
// ❌ OLD (doesn't call your agent)
const response = await fetch('/api/voice-agent/health');

// ✅ NEW (calls your actual agent)
const response = await fetch('/api/retail-ai/audio', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audioData: base64Audio,
    format: 'webm',
    agentId: 'agent_41b2fe861b141729747b0c151d'
  })
});
```

## 🔑 Required Configuration

### Add to your `.env` file:
```env
RETAIL_AI_API_KEY=your_retail_ai_api_key_here
RETAIL_AI_PHONE_NUMBER=your_retail_ai_phone_number
RETAIL_AI_AGENT_ID=agent_41b2fe861b141729747b0c151d
```

### Get Your API Key:
1. Go to your Retail AI dashboard
2. Navigate to API settings
3. Copy your API key
4. Add it to your `.env` file

## 🎤 Microphone Button Flow

### What Should Happen:
1. **User clicks microphone** → Start recording
2. **User speaks** → Record audio
3. **User clicks again** → Stop recording
4. **Convert to base64** → Prepare for transmission
5. **Call `/api/retail-ai/audio`** → Send to your agent
6. **Agent processes** → Returns transcript and response
7. **Show result** → Display appointment booking result

### Current vs Fixed Flow:

**❌ Current (Broken):**
```
Click Mic → Record Audio → Call /api/voice-agent/health → Show "healthy"
```

**✅ Fixed (Working):**
```
Click Mic → Record Audio → Call /api/retail-ai/audio → Agent Processes → Book Appointment
```

## 🚀 Quick Fix for Your Frontend

Update your `voiceAgent.service.ts`:

```typescript
// Replace this method:
private async processRecording(): Promise<void> {
  // OLD: Simulate processing
  this.simulateAppointmentBooking();
  
  // NEW: Call actual agent
  const response = await fetch(`${this.baseUrl}/api/retail-ai/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioData: base64Audio,
      format: 'webm'
    })
  });
  
  const data = await response.json();
  // Handle real agent response
}
```

## 📞 Test Like Retail AI Dashboard

To make your agent call a phone number (like the "Test Call" button in Retail AI):

```bash
curl -X POST http://localhost:3001/api/retail-ai/call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "customerName": "Test User"
  }'
```

## ✅ Verification Checklist

- [ ] Backend APIs created (`/api/retail-ai/*`)
- [ ] Environment variables configured
- [ ] Test page shows successful connections
- [ ] Microphone button calls correct API
- [ ] Agent processes audio and returns responses
- [ ] Appointments are booked in database

## 🎯 Summary

**The APIs you need to call your voice agent:**
1. `POST /api/retail-ai/call` - Trigger phone calls
2. `POST /api/retail-ai/audio` - Process microphone audio
3. `POST /api/retail-ai/session` - Start web conversations
4. `GET /api/retail-ai/test` - Test connection
5. `GET /api/retail-ai/status` - Get agent status

**Your microphone button should call `/api/retail-ai/audio` instead of `/api/voice-agent/health`.**

Now your microphone will actually talk to your Retail AI agent `agent_41b2fe861b141729747b0c151d`! 🎤🤖