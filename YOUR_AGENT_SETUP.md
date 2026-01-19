# Your Voice Agent Setup Guide

## 🤖 Your Agent Details
- **Agent ID**: `agent_41b2fe861b141729747b0c151d`
- **Status**: Active and Listening ✅
- **Integration**: MedFlow Appointment Booking

## 🔧 Webhook Configuration

### Step 1: Configure Webhook URL in Your Agent Dashboard

In your Retail AI dashboard (as shown in your screenshot):

1. **Navigate to "Webhook Settings"**
2. **Set Agent Level Webhook URL to:**
   ```
   http://localhost:3001/api/webhook/voice-agent
   ```
   
   **OR use your agent-specific endpoint:**
   ```
   http://localhost:3001/api/webhook/agent/agent_41b2fe861b141729747b0c151d
   ```

3. **Set Webhook Timeout**: `5s`
4. **Save Configuration**

### Step 2: Test Your Integration

Run the test script to verify everything works:
```powershell
.\test-your-agent.ps1
```

## 🎯 How Your Agent Will Work

### 1. Patient Calls Your Agent
```
Patient: "Hi, I need to book an appointment with a cardiologist"
```

### 2. Your Agent Processes the Request
- Identifies intent: `book_appointment`
- Extracts specialty: `cardiology`
- Calls API: `GET /api/voice-agent/doctors/specialization/cardiology`

### 3. Agent Finds Available Doctors
```
Agent: "I found Dr. Smith, a cardiologist. What date would you prefer?"
Patient: "Tomorrow at 9 AM"
Agent: "What's your name and phone number?"
Patient: "John Doe, 555-123-4567"
```

### 4. Agent Books Appointment
- Sends webhook to: `POST /api/webhook/voice-agent`
- Includes your agent ID: `agent_41b2fe861b141729747b0c151d`
- Creates appointment in MongoDB
- Gets confirmation number

### 5. Agent Confirms Booking
```
Agent: "Perfect! Your appointment is booked with Dr. Smith for tomorrow at 9 AM. 
        Your confirmation number is B3B3B3B5. 
        You'll receive a confirmation shortly."
```

## 📋 Webhook Payload Format

Your agent should send this format:

```json
{
  "event": "appointment_request",
  "callId": "unique-call-id-12345",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "agentId": "agent_41b2fe861b141729747b0c151d",
  "patient": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john.doe@example.com"
  },
  "appointment": {
    "doctorId": "doctor-id-from-api",
    "preferredDate": "2025-01-20",
    "preferredTime": "09:00",
    "consultationType": "in-person",
    "reasonForVisit": "Regular checkup",
    "symptoms": "Chest discomfort"
  },
  "conversation": {
    "transcript": "I'd like to book an appointment with Dr. Smith",
    "confidence": 0.95,
    "intent": "book_appointment"
  }
}
```

## 🔄 Complete Integration Flow

### API Calls Your Agent Can Make:

1. **Get All Doctors**
   ```
   GET http://localhost:3001/api/voice-agent/doctors
   ```

2. **Get Doctors by Specialty**
   ```
   GET http://localhost:3001/api/voice-agent/doctors/specialization/cardiology
   ```

3. **Check Availability**
   ```
   POST http://localhost:3001/api/voice-agent/availability
   {
     "date": "2025-01-20",
     "doctorIds": ["doctor-id-1", "doctor-id-2"]
   }
   ```

4. **Book Appointment (via webhook)**
   ```
   POST http://localhost:3001/api/webhook/voice-agent
   {
     "event": "appointment_request",
     "agentId": "agent_41b2fe861b141729747b0c151d",
     ...
   }
   ```

## 🧪 Testing Steps

### 1. Start Backend Server
```bash
cd medflow-ai-be
npm run dev
```

### 2. Test API Endpoints
```powershell
.\test-your-agent.ps1
```

### 3. Create Test Doctor Profile
You'll need at least one doctor profile for testing. Use your admin panel or API to create one.

### 4. Test Voice Agent
1. Call your voice agent
2. Try booking an appointment
3. Check server logs for webhook calls
4. Verify appointment in MongoDB

## 🎤 Sample Conversation Flow

```
Agent: "Hello! I'm your medical appointment assistant. How can I help you today?"

Patient: "I need to see a cardiologist"

Agent: "I can help you book an appointment with a cardiologist. Let me check available doctors..."
[Calls: GET /api/voice-agent/doctors/specialization/cardiology]

Agent: "I found Dr. Smith, a cardiologist with 15 years of experience. What date would work for you?"

Patient: "How about tomorrow?"

Agent: "Let me check Dr. Smith's availability for tomorrow..."
[Calls: POST /api/voice-agent/availability]

Agent: "Dr. Smith has appointments available at 9:00 AM, 11:30 AM, and 2:00 PM. Which time works best?"

Patient: "9:00 AM sounds good"

Agent: "Perfect! I'll need your name and phone number to book the appointment."

Patient: "My name is John Doe and my phone is 555-123-4567"

Agent: "Thank you, John. Let me book that appointment for you..."
[Sends webhook: POST /api/webhook/voice-agent]

Agent: "Excellent! Your appointment is confirmed with Dr. Smith for tomorrow at 9:00 AM. Your confirmation number is B3B3B3B5. Is there anything else I can help you with?"
```

## 🚀 Production Deployment

### For Production Use:

1. **Update Webhook URLs** to your production domain:
   ```
   https://your-domain.com/api/webhook/voice-agent
   ```

2. **Enable HTTPS** for secure communication

3. **Add Authentication** if needed for production security

4. **Monitor Webhook Calls** for debugging and analytics

## 📊 Monitoring & Logs

Your backend will log all interactions:
```
📞 Voice Agent Webhook Received: {...}
🤖 Request from Agent ID: agent_41b2fe861b141729747b0c151d
✅ Appointment created via webhook: 60f7b3b3b3b3b3b3b3b3b3b5
```

## 🎯 Your Next Steps

1. ✅ **Configure webhook URL** in your agent dashboard
2. ⏳ **Create doctor profiles** for testing
3. ⏳ **Test the integration** with a phone call
4. ⏳ **Monitor appointments** in your database
5. ⏳ **Deploy to production** when ready

Your voice agent `agent_41b2fe861b141729747b0c151d` is now ready to book medical appointments! 🎉