# Voice Agent Webhook Configuration Guide

## 🎯 Webhook URLs for Your Voice Agent

Based on your screenshot, you need to configure these webhook URLs in your Retail AI voice agent:

### Primary Webhook URL
```
http://localhost:3001/api/webhook/voice-agent
```

### Alternative Webhook URLs
```
http://localhost:3001/api/webhook/appointment-data
http://localhost:3001/api/webhook/test
```

## 🔧 Configuration Steps

### Step 1: Configure in Your Voice Agent Dashboard

1. **Open your voice agent settings** (as shown in your screenshot)
2. **Navigate to "Webhook Settings"**
3. **Set the Agent Level Webhook URL to:**
   ```
   http://localhost:3001/api/webhook/voice-agent
   ```
4. **Set Webhook Timeout to:** `5s` (or as needed)
5. **Save the configuration**

### Step 2: Webhook Event Types

Your webhook will receive different event types:

#### 1. Appointment Request
When a user wants to book an appointment:
```json
{
  "event": "appointment_request",
  "callId": "unique-call-id",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "patient": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john.doe@example.com"
  },
  "appointment": {
    "doctorId": "doctor-id-here",
    "preferredDate": "2025-01-20",
    "preferredTime": "09:00",
    "consultationType": "in-person",
    "reasonForVisit": "Regular checkup"
  },
  "conversation": {
    "transcript": "I would like to book an appointment",
    "confidence": 0.95,
    "intent": "book_appointment"
  }
}
```

#### 2. Appointment Confirmation
When a user confirms an appointment:
```json
{
  "event": "appointment_confirmation",
  "callId": "unique-call-id",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "confirmationNumber": "B3B3B3B5",
  "conversation": {
    "transcript": "Yes, I confirm my appointment",
    "confidence": 0.92,
    "intent": "confirm_appointment"
  }
}
```

#### 3. Appointment Cancellation
When a user cancels an appointment:
```json
{
  "event": "appointment_cancellation",
  "callId": "unique-call-id",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "confirmationNumber": "B3B3B3B5",
  "conversation": {
    "transcript": "I need to cancel my appointment",
    "confidence": 0.88,
    "intent": "cancel_appointment"
  }
}
```

## 🎤 Voice Agent Integration Flow

### 1. User Calls Voice Agent
```
User: "I need to book an appointment with a cardiologist"
```

### 2. Voice Agent Processes Request
- Extracts intent: `book_appointment`
- Identifies specialty: `cardiology`
- Calls your API: `GET /api/voice-agent/doctors/specialization/cardiology`

### 3. Voice Agent Collects Information
```
Agent: "I found Dr. Smith. What date works for you?"
User: "Tomorrow at 9 AM"
Agent: "What's your name and phone number?"
User: "John Doe, 555-123-4567"
```

### 4. Voice Agent Sends Webhook
- Sends appointment request to: `POST /api/webhook/voice-agent`
- Your backend creates the appointment
- Returns confirmation number

### 5. Voice Agent Confirms
```
Agent: "Perfect! Your appointment is booked. 
        Confirmation number is B3B3B3B5"
```

## 🧪 Testing Your Webhook

### Test 1: Start Your Server
```bash
cd medflow-ai-be
npm run dev
```

### Test 2: Test Webhook Health
```bash
curl http://localhost:3001/api/webhook/health
```

### Test 3: Test with Sample Data
```bash
node test-webhook.js
```

### Test 4: Test from Your Voice Agent
1. Configure the webhook URL in your agent
2. Make a test call to your voice agent
3. Try booking an appointment
4. Check your server logs for webhook data

## 📋 Webhook Response Format

Your backend will respond to webhooks with:

### Success Response
```json
{
  "success": true,
  "message": "Webhook processed successfully for event: appointment_request",
  "data": {
    "appointmentId": "60f7b3b3b3b3b3b3b3b3b3b5",
    "confirmationNumber": "B3B3B3B5",
    "status": "pending",
    "appointmentDate": "2025-01-20T00:00:00.000Z",
    "appointmentTime": "09:00",
    "patientName": "John Doe"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Missing required fields: patient name and phone",
  "callId": "unique-call-id"
}
```

## 🔒 Security Considerations

### For Development
- Webhook endpoints are public (no authentication required)
- Use HTTP for local development

### For Production
1. **Use HTTPS** for all webhook URLs
2. **Add webhook signature verification**
3. **Implement rate limiting**
4. **Add IP whitelisting** for your voice agent
5. **Use environment variables** for sensitive data

## 🚀 Production Deployment

### Step 1: Deploy Your Backend
```bash
# Example for cloud deployment
npm run build
# Deploy to your cloud provider
```

### Step 2: Update Webhook URLs
Replace `localhost:3001` with your production domain:
```
https://your-domain.com/api/webhook/voice-agent
```

### Step 3: Configure HTTPS
Ensure your voice agent can reach your HTTPS endpoint.

## 📊 Monitoring & Logging

### Webhook Logs
Your backend logs all webhook calls:
```
📞 Voice Agent Webhook Received: {event: "appointment_request", ...}
✅ Appointment created via webhook: 60f7b3b3b3b3b3b3b3b3b3b5
```

### Error Tracking
Monitor for webhook failures:
```
❌ Webhook Error: Missing required fields
❌ Appointment request error: Doctor not found
```

## 🔧 Troubleshooting

### Common Issues

1. **Webhook URL not reachable**
   - Check if your server is running
   - Verify the URL is correct
   - Test with curl or Postman

2. **Invalid JSON data**
   - Check webhook payload format
   - Ensure Content-Type is application/json

3. **Missing required fields**
   - Verify your voice agent sends all required data
   - Check the webhook payload structure

4. **Doctor not found**
   - Ensure you have created doctor profiles
   - Verify doctor IDs are correct

### Debug Steps

1. **Check server logs** for webhook calls
2. **Test webhook manually** with curl
3. **Verify voice agent configuration**
4. **Check network connectivity**

## 📞 Support

If you encounter issues:
1. Check the server console logs
2. Test webhooks manually with the test script
3. Verify your voice agent webhook configuration
4. Ensure all required fields are being sent

## 🎯 Next Steps

1. **Configure your voice agent** with the webhook URL
2. **Test the integration** with a sample call
3. **Create some doctor profiles** for testing
4. **Monitor webhook logs** during testing
5. **Deploy to production** when ready

Your webhook integration is now ready! Configure your voice agent with:
```
http://localhost:3001/api/webhook/voice-agent
```