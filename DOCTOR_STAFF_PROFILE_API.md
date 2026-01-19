# Doctor & Staff Profile API Reference

## Overview
Complete profile system for doctors and staff with role-based access control.

---

## Doctor Profile Endpoints

### 1. Create/Update Doctor Profile
- **POST** `/api/doctor/profile`
- **Auth Required**: ✅ (Doctor only)
- **Description**: Create new or update existing doctor profile

**Request Body:**
```json
{
  "gender": "female",
  "dob": "1990-05-15",
  "photo": "https://example.com/photo.jpg",
  "specialization": "Cardiology",
  "licenseNumber": "MD12345",
  "licenseAuthority": "Medical Council",
  "licenseExpiry": "2026-12-31",
  "experienceYears": 8,
  "clinic": "City Hospital",
  "designation": "Senior Cardiologist",
  "workingDays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "workingHours": {
    "start": "09:00",
    "end": "18:00"
  },
  "breakTimes": [
    {
      "start": "13:00",
      "end": "14:00"
    }
  ],
  "consultationType": "both",
  "appointmentDuration": 30,
  "bio": "Experienced cardiologist",
  "languages": ["English", "Spanish"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Doctor profile updated successfully",
  "data": {
    "_id": "507f...",
    "userId": "507f...",
    "specialization": "Cardiology",
    "licenseNumber": "MD12345",
    "profileCompleted": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 2. Get My Doctor Profile
- **GET** `/api/doctor/profile/me`
- **Auth Required**: ✅ (Doctor only)
- **Description**: Get current logged-in doctor's profile

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f...",
    "userId": {
      "_id": "507f...",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "dr.smith@clinic.com",
      "phone": "+1234567890",
      "profileImage": null
    },
    "specialization": "Cardiology",
    "licenseNumber": "MD12345",
    "profileCompleted": true
  }
}
```

---

### 3. Get Doctor Profile by User ID
- **GET** `/api/doctor/profile/:id`
- **Auth Required**: ❌ (Anyone can view)
- **Description**: Get doctor profile by user ID

**URL Parameters:**
```
:id = User ID (userId field)
```

---

### 4. Get All Doctor Profiles
- **GET** `/api/doctor/profiles`
- **Auth Required**: ❌ (Anyone can view)
- **Description**: Get all doctor profiles with pagination and filtering

**Query Parameters:**
```
?limit=10&page=1&specialization=Cardiology
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "profiles": [...],
    "total": 50,
    "pages": 5
  }
}
```

---

### 5. Update Doctor Profile
- **PUT** `/api/doctor/profile`
- **Auth Required**: ✅ (Doctor only)
- **Description**: Update specific fields in doctor profile

**Request Body:**
```json
{
  "bio": "Updated bio",
  "appointmentDuration": 45
}
```

---

### 6. Delete Doctor Profile
- **DELETE** `/api/doctor/profile`
- **Auth Required**: ✅ (Doctor only)
- **Description**: Delete doctor's complete profile

---

### 7. Check Profile Completion
- **GET** `/api/doctor/profile/status/check`
- **Auth Required**: ✅ (Doctor only)
- **Description**: Check if doctor profile is complete

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "profileCompleted": true
  }
}
```

---

## Staff Profile Endpoints

### 1. Create/Update Staff Profile
- **POST** `/api/staff/profile`
- **Auth Required**: ✅ (Staff only)
- **Description**: Create new or update existing staff profile

**Request Body:**
```json
{
  "gender": "female",
  "dob": "1995-08-20",
  "photo": "https://example.com/photo.jpg",
  "staffRole": "nurse",
  "employeeId": "NUR001",
  "department": "Cardiology",
  "experienceYears": 5,
  "supervisorDoctorId": "DOCTOR_USER_ID",
  "shiftTiming": {
    "start": "08:00",
    "end": "17:00"
  },
  "workingDays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "emergencyContact": {
    "name": "John Jones",
    "phone": "+1234567800",
    "relationship": "Brother"
  }
}
```

---

### 2. Get My Staff Profile
- **GET** `/api/staff/profile/me`
- **Auth Required**: ✅ (Staff only)
- **Description**: Get current logged-in staff's profile

---

### 3. Get Staff Profile by User ID
- **GET** `/api/staff/profile/:id`
- **Auth Required**: ❌ (Anyone can view)
- **Description**: Get staff profile by user ID

---

### 4. Get All Staff Profiles
- **GET** `/api/staff/profiles`
- **Auth Required**: ❌ (Anyone can view)
- **Description**: Get all staff profiles with pagination and filtering

**Query Parameters:**
```
?limit=10&page=1&staffRole=nurse&department=Cardiology
```

---

### 5. Get Staff by Supervisor Doctor
- **GET** `/api/staff/doctor/:doctorId/staff`
- **Auth Required**: ❌ (Anyone can view)
- **Description**: Get all staff members supervised by a specific doctor

**URL Parameters:**
```
:doctorId = Doctor's user ID
```

**Query Parameters:**
```
?limit=10&page=1
```

---

### 6. Update Staff Profile
- **PUT** `/api/staff/profile`
- **Auth Required**: ✅ (Staff only)
- **Description**: Update specific fields in staff profile

---

### 7. Delete Staff Profile
- **DELETE** `/api/staff/profile`
- **Auth Required**: ✅ (Staff only)
- **Description**: Delete staff's complete profile

---

### 8. Check Profile Completion
- **GET** `/api/staff/profile/status/check`
- **Auth Required**: ✅ (Staff only)
- **Description**: Check if staff profile is complete

---

## Required Fields

### Doctor Profile (Required)
- `specialization` - e.g., "Cardiology", "Neurology"
- `licenseNumber` - Medical license number
- `licenseAuthority` - Issuing authority
- `licenseExpiry` - License expiration date
- `experienceYears` - Years of experience
- `designation` - Job title
- `workingHours` - { start: "HH:MM", end: "HH:MM" }
- `consultationType` - "online" | "in-person" | "both"
- `appointmentDuration` - Duration in minutes (min: 15)

### Staff Profile (Required)
- `staffRole` - e.g., "nurse", "technician"
- `employeeId` - Unique employee ID
- `department` - Department name
- `experienceYears` - Years of experience
- `shiftTiming` - { start: "HH:MM", end: "HH:MM" }
- `emergencyContact` - { name, phone, relationship }

---

## Profile Completion Flow

1. **User signs up** (doctor or staff)
   - `User.profileCompleted = false`

2. **User creates/updates profile** (POST /api/doctor/profile or /api/staff/profile)
   - `DoctorProfile.profileCompleted = true`
   - `User.profileCompleted = true`

3. **Check profile status**
   - GET /api/doctor/profile/status/check
   - Returns: `{ profileCompleted: true }`

---

## Authorization Rules

### Doctor Routes
- `POST /api/doctor/profile` - Doctor only
- `GET /api/doctor/profile/me` - Doctor only
- `GET /api/doctor/profile/:id` - Anyone (public)
- `GET /api/doctor/profiles` - Anyone (public)
- `PUT /api/doctor/profile` - Doctor only
- `DELETE /api/doctor/profile` - Doctor only
- `GET /api/doctor/profile/status/check` - Doctor only

### Staff Routes
- `POST /api/staff/profile` - Staff only
- `GET /api/staff/profile/me` - Staff only
- `GET /api/staff/profile/:id` - Anyone (public)
- `GET /api/staff/profiles` - Anyone (public)
- `GET /api/staff/doctor/:doctorId/staff` - Anyone (public)
- `PUT /api/staff/profile` - Staff only
- `DELETE /api/staff/profile` - Staff only
- `GET /api/staff/profile/status/check` - Staff only

---

## Example Workflow

### Doctor Workflow
```
1. Sign up as doctor
   POST /api/users/signup with role="doctor"

2. Login
   POST /api/users/login

3. Check if profile is complete
   GET /api/doctor/profile/status/check
   Response: { profileCompleted: false }

4. Create doctor profile
   POST /api/doctor/profile with all required fields

5. Check profile again
   GET /api/doctor/profile/status/check
   Response: { profileCompleted: true }

6. View own profile
   GET /api/doctor/profile/me

7. Update profile
   PUT /api/doctor/profile with updated fields
```

### Staff Workflow
```
1. Sign up as staff
   POST /api/users/signup with role="staff"

2. Login
   POST /api/users/login

3. Check if profile is complete
   GET /api/staff/profile/status/check
   Response: { profileCompleted: false }

4. Create staff profile
   POST /api/staff/profile with all required fields

5. Check profile again
   GET /api/staff/profile/status/check
   Response: { profileCompleted: true }

6. View own profile
   GET /api/staff/profile/me

7. View supervised staff (for doctors)
   GET /api/staff/doctor/{doctorId}/staff
```

---

## Validation Rules

### Time Format
- Format: "HH:MM" (24-hour)
- Examples: "09:00", "14:30", "23:59"

### Phone Number Format
- Format: International format
- Examples: "+1234567890", "(123) 456-7890"

### Appointment Duration
- Minimum: 15 minutes
- Recommended: 30, 45, 60 minutes

### Working Days
- Array of day names: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

---

## Error Responses

### 400 - Validation Error
```json
{
  "success": false,
  "message": "Specialization is required"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 403 - Forbidden (Wrong Role)
```json
{
  "success": false,
  "message": "Access denied. Required roles: doctor"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Doctor profile not found"
}
```

---

## Test with cURL

See `PROFILE_API_CALLS.sh` file for complete cURL examples.
