# User Authentication API Documentation

## Overview
Complete user authentication system with JWT, role-based access control, and comprehensive user management.

---

## Authentication Endpoints

### 1. **Sign Up**
- **POST** `/api/users/signup`
- **Public** ✅
- **Description**: Register a new user account

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "role": "patient" // optional, default: "patient"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "isActive": true,
      "isEmailVerified": false
    }
  }
}
```

**Error Response (400/409):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### 2. **Login**
- **POST** `/api/users/login`
- **Public** ✅
- **Description**: Login with email and password

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "lastLogin": "2025-01-15T10:30:00Z"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. **Request Password Reset**
- **POST** `/api/users/request-password-reset`
- **Public** ✅
- **Description**: Request password reset link (sends via email in production)

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset link sent to email",
  "data": {
    "resetToken": "a1b2c3d4e5f6..." // Remove in production
  }
}
```

---

### 4. **Reset Password**
- **POST** `/api/users/reset-password`
- **Public** ✅
- **Description**: Reset password using the reset token

**Request Body:**
```json
{
  "resetToken": "a1b2c3d4e5f6...",
  "newPassword": "newPassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 5. **Verify Email**
- **POST** `/api/users/verify-email`
- **Public** ✅
- **Description**: Verify email with verification token

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

## User Profile Endpoints

### 6. **Get Current Profile**
- **GET** `/api/users/profile`
- **Protected** 🔒
- **Description**: Get authenticated user's profile

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "dateOfBirth": "1990-05-15T00:00:00Z",
    "gender": "male",
    "role": "patient",
    "isActive": true,
    "isEmailVerified": false,
    "lastLogin": "2025-01-15T10:30:00Z",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 7. **Update Profile**
- **PUT** `/api/users/profile`
- **Protected** 🔒
- **Description**: Update user profile information

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "firstName": "John",
  "lastName": "Doe",
  "profileImage": "https://example.com/image.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "updatedAt": "2025-01-15T11:00:00Z"
  }
}
```

---

### 8. **Change Password**
- **POST** `/api/users/change-password`
- **Protected** 🔒
- **Description**: Change password (requires old password)

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "oldPassword": "currentPassword123",
  "newPassword": "newPassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 9. **Deactivate Account**
- **POST** `/api/users/deactivate`
- **Protected** 🔒
- **Description**: Deactivate user's account

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account deactivated successfully"
}
```

---

## Admin Endpoints

### 10. **Get All Users**
- **GET** `/api/users/all`
- **Protected** 🔒
- **Admin Only** 👑
- **Description**: Get all users with pagination and filtering

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Query Parameters:**
```
?limit=10&page=1&role=patient
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "patient",
        "isActive": true
      }
    ],
    "total": 50,
    "pages": 5
  }
}
```

---

### 11. **Get User by ID**
- **GET** `/api/users/:id`
- **Protected** 🔒
- **Admin Only** 👑
- **Description**: Get specific user details

**Headers:**
```
Authorization: Bearer {admin_token}
```

**URL Parameters:**
```
:id = User MongoDB ID
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 12. **Get Users by Role**
- **GET** `/api/users/role/:role`
- **Protected** 🔒
- **Admin Only** 👑
- **Description**: Get all users of specific role

**Headers:**
```
Authorization: Bearer {admin_token}
```

**URL Parameters:**
```
:role = patient | doctor | nurse | admin
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient"
    }
  ]
}
```

---

### 13. **Delete User**
- **DELETE** `/api/users/:id`
- **Protected** 🔒
- **Admin Only** 👑
- **Description**: Delete a user account

**Headers:**
```
Authorization: Bearer {admin_token}
```

**URL Parameters:**
```
:id = User MongoDB ID
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Role-Based Fields

### Patient Fields
```json
{
  "role": "patient",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "dateOfBirth": "Date",
  "gender": "male | female | other",
  "profileImage": "string (URL)"
}
```

### Doctor Fields
```json
{
  "role": "doctor",
  "employeeId": "string",
  "specialization": "Cardiology | Neurology | etc.",
  "department": "string",
  "licenseNumber": "string",
  "hireDate": "Date",
  "clinicId": "ObjectId (ref: Clinic)"
}
```

### Nurse Fields
```json
{
  "role": "nurse",
  "employeeId": "string",
  "department": "string",
  "hireDate": "Date",
  "clinicId": "ObjectId (ref: Clinic)"
}
```

### Admin Fields
```json
{
  "role": "admin",
  "employeeId": "string",
  "department": "string",
  "hireDate": "Date"
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Validation error | Missing or invalid request data |
| 401 | Unauthorized | Invalid/missing token or credentials |
| 403 | Forbidden | User doesn't have required role |
| 404 | Not found | Resource doesn't exist |
| 409 | Conflict | Email already registered |
| 500 | Server error | Internal server error |

---

## JWT Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "role": "patient",
  "iat": 1641211200,
  "exp": 1641816000
}
```

---

## Usage Examples

### Example 1: Complete Login Flow
```bash
# 1. Signup
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Response includes token
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGciOiJIUzI1NiIs...",
#     "user": {...}
#   }
# }

# 2. Use token to access protected route
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Example 2: Password Reset Flow
```bash
# 1. Request reset
curl -X POST http://localhost:3000/api/users/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'

# Get resetToken from response (check email in production)

# 2. Reset password
curl -X POST http://localhost:3000/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "token_from_email",
    "newPassword": "newPassword123"
  }'
```

---

## Security Notes

1. **Passwords**: Always hashed with bcryptjs (10 salt rounds)
2. **Tokens**: JWT with 7-day expiration (configurable via JWT_EXPIRE env var)
3. **Password Reset**: Token expires in 30 minutes
4. **Email**: Stored as lowercase and trimmed
5. **Password Field**: Never returned in responses (select: false)

---

## Environment Variables

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
MONGO_URI=mongodb://localhost:27017/medflow-ai
PORT=3000
```

---

## Notes

- All timestamps use ISO 8601 format
- Passwords must be at least 6 characters
- Role enum: `patient`, `doctor`, `nurse`, `admin`
- Gender enum: `male`, `female`, `other`
- All protected routes require valid JWT token in Authorization header
