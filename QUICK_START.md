# 🚀 Quick Start Guide - User Authentication

## Installation & Setup (2 minutes)

### 1. **Install Dependencies**
```bash
npm install
```
✅ Already done! All packages (bcryptjs, jsonwebtoken) are installed.

### 2. **Configure Environment**
Create or update `.env` file in project root:
```env
JWT_SECRET=medflow-ai-super-secret-key-2025
JWT_EXPIRE=7d
MONGO_URI=mongodb://localhost:27017/medflow-ai
PORT=3000
```

### 3. **Start Development Server**
```bash
npm run dev
```
Server starts at `http://localhost:3000`

---

## Quick Test (Using PowerShell on Windows)

### Run Test Script
```powershell
.\test-api.ps1
```

This will:
1. ✅ Sign up a new user
2. ✅ Login with credentials
3. ✅ Get user profile
4. ✅ Update profile
5. ✅ Change password
6. ✅ Request password reset
7. ✅ Reset password
8. ✅ Admin operations

---

## Manual Testing (Using cURL)

### 1. **Sign Up**
```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "507f...",
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient"
    }
  }
}
```

### 2. **Login**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Copy the `token` from response.

### 3. **Get Your Profile**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. **Update Profile**
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "dateOfBirth": "1990-05-15",
    "gender": "male"
  }'
```

### 5. **Change Password**
```bash
curl -X POST http://localhost:3000/api/users/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "password123",
    "newPassword": "newPassword456"
  }'
```

---

## Using Postman

### 1. **Create New Collection**
- Name: "MedFlow Auth API"

### 2. **Create Requests**

#### Sign Up
- **Method:** POST
- **URL:** `http://localhost:3000/api/users/signup`
- **Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient"
}
```

#### Login
- **Method:** POST
- **URL:** `http://localhost:3000/api/users/login`
- **Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

#### Get Profile
- **Method:** GET
- **URL:** `http://localhost:3000/api/users/profile`
- **Headers:**
  - Key: `Authorization`
  - Value: `Bearer TOKEN_FROM_LOGIN`

---

## API Endpoints Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/signup` | ❌ | Register new user |
| POST | `/api/users/login` | ❌ | Login user |
| GET | `/api/users/profile` | ✅ | Get your profile |
| PUT | `/api/users/profile` | ✅ | Update profile |
| POST | `/api/users/change-password` | ✅ | Change password |
| POST | `/api/users/request-password-reset` | ❌ | Request password reset |
| POST | `/api/users/reset-password` | ❌ | Reset password with token |
| POST | `/api/users/verify-email` | ❌ | Verify email |
| POST | `/api/users/deactivate` | ✅ | Deactivate account |
| GET | `/api/users/all` | ✅👑 | Get all users (Admin) |
| GET | `/api/users/:id` | ✅👑 | Get user by ID (Admin) |
| GET | `/api/users/role/:role` | ✅👑 | Get users by role (Admin) |
| DELETE | `/api/users/:id` | ✅👑 | Delete user (Admin) |

✅ = Requires valid JWT token  
👑 = Admin role required

---

## Creating Different User Roles

### Patient (Default)
```json
{
  "email": "patient@example.com",
  "password": "pass123",
  "firstName": "John",
  "lastName": "Patient",
  "role": "patient"
}
```

### Doctor
```json
{
  "email": "doctor@example.com",
  "password": "pass123",
  "firstName": "Jane",
  "lastName": "Doctor",
  "role": "doctor",
  "specialization": "Cardiology",
  "department": "Cardiology",
  "licenseNumber": "MD12345",
  "employeeId": "DOC001"
}
```

### Nurse
```json
{
  "email": "nurse@example.com",
  "password": "pass123",
  "firstName": "Sarah",
  "lastName": "Nurse",
  "role": "nurse",
  "department": "General",
  "employeeId": "NUR001"
}
```

### Admin
```json
{
  "email": "admin@example.com",
  "password": "pass123",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "employeeId": "ADM001"
}
```

---

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:** 
- Ensure MongoDB is running
- Check MONGO_URI in .env
- Default should work: `mongodb://localhost:27017/medflow-ai`

### Issue: "Invalid token" when accessing protected routes
**Solution:**
- Ensure you're using the token from login/signup response
- Include "Bearer " before the token in Authorization header
- Token expires in 7 days (configurable)

### Issue: "Password reset token invalid"
**Solution:**
- Reset tokens expire after 30 minutes
- Request a new one from `/api/users/request-password-reset`

### Issue: TypeScript compilation errors
**Solution:**
```bash
npm run build
```
Check dist/ folder - if no errors, build succeeded.

---

## Project Files Overview

📁 **Key Files You'll Work With:**
- `src/app.ts` - Express app configuration
- `src/server.ts` - Server entry point
- `.env` - Environment variables
- `API_DOCUMENTATION.md` - Full API documentation
- `test-api.ps1` - Windows test script

📁 **Authentication System Files:**
- `src/models/User.ts` - Database schema
- `src/services/userService.ts` - Business logic
- `src/controllers/userController.ts` - Request handlers
- `src/routes/userRoutes.ts` - API endpoints
- `src/middlewares/authMiddleware.ts` - JWT verification
- `src/validators/userValidator.ts` - Input validation
- `src/utils/jwt.ts` - Token utilities
- `src/utils/errors.ts` - Error handling

---

## Next Steps

1. ✅ **Start the server** → `npm run dev`
2. ✅ **Run tests** → `.\test-api.ps1` (Windows) or `./test-api.sh` (Linux/Mac)
3. ✅ **Try endpoints** → Use Postman or cURL
4. ⚠️ **Add email service** → Integrate sendgrid for password reset emails
5. ⚠️ **Add rate limiting** → Prevent brute force attacks
6. ⚠️ **Add more features** → Two-factor auth, social login, etc.

---

## Support & Documentation

- 📖 **Full API docs**: See `API_DOCUMENTATION.md`
- 📋 **Project structure**: See `PROJECT_STRUCTURE.md`
- ⚙️ **Implementation details**: See `USER_AUTH_SETUP.md`

---

## Security Checklist

✅ Passwords hashed with bcryptjs (10 rounds)
✅ JWT authentication enabled
✅ Role-based access control
✅ Input validation on all endpoints
✅ Error messages don't leak sensitive info
✅ Database indexes for performance
✅ Email stored as lowercase
✅ Password never returned in responses
✅ Reset tokens expire (30 minutes)
✅ Account activation/deactivation support

---

**You're all set! Happy coding! 🎉**

Questions? Check the documentation files or review the code comments.
