# Voice Agent Integration Guide

## Overview
This document provides a complete guide for integrating your Retail AI voice agent with the MedFlow appointment booking system.

## API Base URL
```
http://localhost:3001/api/voice-agent
```

## Authentication
Voice agent endpoints are **public** and do not require authentication for booking appointments.

## Available Endpoints

### 1. Health Check
**GET** `/health`

Check if the voice agent API is running.

**Response:**
```json
{
  "success": true,
  "message": "Voice agent API is healthy",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "endpoints": {
    "getDoctors": "GET /api/voice-agent/doctors",
    "getDoctorsBySpecialization": "GET /api/voice-agent/doctors/specialization/:specialization",
    "checkAvailability": "POST /api/voice-agent/availability",
    "bookAppointment": "POST /api/voice-agent/book",
    "getAppointment": "GET /api/voice-agent/appointment/:confirmationNumber",
    "cancelAppointment": "DELETE /api/voice-agent/appointment/:confirmationNumber"
  }
}
```

### 2. Get All Doctors
**GET** `/doctors`

Get list of all available doctors.

**Response:**
```json
{
  "success": true,
  "message": "Available doctors retrieved successfully",
  "data": [
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Dr. John Smith",
      "specialization": "Cardiology",
      "workingDays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
      "workingHours": {
        "start": "09:00",
        "end": "17:00"
      },
      "consultationType": "both",
      "appointmentDuration": 30
    }
  ]
}
```

### 3. Get Doctors by Specialization
**GET** `/doctors/specialization/:specialization`

Get doctors filtered by specialization.

**Parameters:**
- `specialization` (string): Doctor's specialization (e.g., "cardiology", "dermatology")

**Example:**
```
GET /api/voice-agent/doctors/specialization/cardiology
```

### 4. Check Availability
**POST** `/availability`

Check available time slots for multiple doctors on a specific date.

**Request Body:**
```json
{
  "date": "2025-01-20",
  "doctorIds": ["60f7b3b3b3b3b3b3b3b3b3b3", "60f7b3b3b3b3b3b3b3b3b3b4"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Availability checked successfully",
  "data": [
    {
      "doctorId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "doctorName": "Dr. John Smith",
      "date": "2025-01-20",
      "availableSlots": ["09:00", "09:30", "10:00", "14:00"],
      "totalSlots": 16,
      "availableCount": 4
    }
  ]
}
```

### 5. Book Appointment
**POST** `/book`

Book an appointment via voice agent.

**Request Body:**
```json
{
  "doctorId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "appointmentDate": "2025-01-20",
  "appointmentTime": "09:00",
  "patientName": "John Doe",
  "patientPhone": "+1234567890",
  "patientEmail": "john.doe@example.com",
  "consultationType": "in-person",
  "reasonForVisit": "Regular checkup",
  "symptoms": "Chest pain",
  "voiceAgentData": {
    "callId": "call-123456",
    "transcript": "I would like to book an appointment with Dr. Smith",
    "confidence": 0.95
  }
}
```

**Required Fields:**
- `doctorId`
- `appointmentDate` (YYYY-MM-DD format)
- `appointmentTime` (HH:MM format)
- `patientName`
- `patientPhone`

**Response:**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "appointmentId": "60f7b3b3b3b3b3b3b3b3b3b5",
    "confirmationNumber": "B3B3B3B5",
    "doctorName": "Dr. John Smith",
    "patientName": "John Doe",
    "appointmentDate": "2025-01-20T00:00:00.000Z",
    "appointmentTime": "09:00",
    "consultationType": "in-person",
    "status": "pending",
    "duration": 30
  }
}
```

### 6. Get Appointment by Confirmation Number
**GET** `/appointment/:confirmationNumber`

Retrieve appointment details using the 8-character confirmation number.

**Parameters:**
- `confirmationNumber` (string): 8-character confirmation code

**Example:**
```
GET /api/voice-agent/appointment/B3B3B3B5
```

### 7. Cancel Appointment
**DELETE** `/appointment/:confirmationNumber`

Cancel an appointment using the confirmation number.

**Request Body:**
```json
{
  "reason": "Patient requested cancellation"
}
```

## Voice Agent Integration Steps

### Step 1: Configure Your Voice Agent
Update your voice agent configuration to use these endpoints:

1. **Base URL**: `http://localhost:3001/api/voice-agent`
2. **Content-Type**: `application/json`
3. **No authentication required**

### Step 2: Implement Conversation Flow

#### 1. **Doctor Discovery**
```javascript
// Get all doctors
const doctors = await fetch('/api/voice-agent/doctors');

// Or get by specialization
const cardiologists = await fetch('/api/voice-agent/doctors/specialization/cardiology');
```

#### 2. **Check Availability**
```javascript
const availability = await fetch('/api/voice-agent/availability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2025-01-20',
    doctorIds: ['doctor-id-1', 'doctor-id-2']
  })
});
```

#### 3. **Book Appointment**
```javascript
const appointment = await fetch('/api/voice-agent/book', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    doctorId: 'selected-doctor-id',
    appointmentDate: '2025-01-20',
    appointmentTime: '09:00',
    patientName: 'John Doe',
    patientPhone: '+1234567890',
    consultationType: 'in-person',
    voiceAgentData: {
      callId: 'unique-call-id',
      transcript: 'conversation transcript',
      confidence: 0.95
    }
  })
});
```

### Step 3: Handle Responses

#### Success Response
```javascript
if (appointment.success) {
  const confirmationNumber = appointment.data.confirmationNumber;
  // Tell user: "Your appointment is booked. Confirmation number is B3B3B3B5"
}
```

#### Error Response
```javascript
if (!appointment.success) {
  const errorMessage = appointment.message;
  // Tell user about the error and suggest alternatives
}
```

## Sample Voice Agent Conversation Flow

```
Agent: "Hello! I can help you book a medical appointment. What type of doctor would you like to see?"

User: "I need to see a cardiologist"

Agent: "Let me find available cardiologists for you..."
[Call: GET /doctors/specialization/cardiology]

Agent: "I found Dr. John Smith, a cardiologist. What date would you prefer?"

User: "Tomorrow"

Agent: "Let me check Dr. Smith's availability for tomorrow..."
[Call: POST /availability with tomorrow's date]

Agent: "Dr. Smith has slots available at 9:00 AM, 10:30 AM, and 2:00 PM. Which time works for you?"

User: "9:00 AM sounds good"

Agent: "Perfect! I'll need your name and phone number to book the appointment."

User: "My name is John Doe and my phone is 555-123-4567"

Agent: "Booking your appointment now..."
[Call: POST /book with all details]

Agent: "Great! Your appointment is confirmed. Your confirmation number is B3B3B3B5. You have an appointment with Dr. John Smith tomorrow at 9:00 AM."
```

## Error Handling

### Common Errors
1. **Doctor not found**: `404 - Doctor not found or inactive`
2. **Time slot unavailable**: `400 - Time slot not available: Outside working hours`
3. **Invalid date**: `400 - Appointment date cannot be in the past`
4. **Missing fields**: `400 - Missing required fields: patientName, patientPhone`

### Retry Logic
Implement retry logic for:
- Network timeouts
- Server errors (5xx)
- Rate limiting (if implemented)

## Testing

### 1. Start the Server
```bash
cd medflow-ai-be
npm run dev
```

### 2. Run Test Script
```bash
node test-voice-agent-api.js
```

### 3. Manual Testing with curl
```bash
# Health check
curl http://localhost:3001/api/voice-agent/health

# Get doctors
curl http://localhost:3001/api/voice-agent/doctors

# Book appointment
curl -X POST http://localhost:3001/api/voice-agent/book \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOCTOR_ID_HERE",
    "appointmentDate": "2025-01-20",
    "appointmentTime": "09:00",
    "patientName": "John Doe",
    "patientPhone": "+1234567890",
    "consultationType": "in-person"
  }'
```

## Production Considerations

### 1. Security
- Add rate limiting for voice agent endpoints
- Implement API key authentication for production
- Add request logging and monitoring

### 2. Scalability
- Add caching for doctor availability
- Implement queue system for high-volume bookings
- Add database indexing for performance

### 3. Reliability
- Add webhook notifications for appointment confirmations
- Implement appointment reminders
- Add conflict resolution for simultaneous bookings

## Next Steps

1. **Test the integration** with your voice agent
2. **Configure your voice agent** to use these endpoints
3. **Implement error handling** in your voice agent
4. **Add appointment confirmations** via SMS/email
5. **Monitor and optimize** the integration

## Support

For issues or questions about the voice agent integration, check:
1. Server logs in the console
2. API response error messages
3. Network connectivity between voice agent and backend