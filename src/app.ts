// src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import userRoutes from "./routes/userRoutes";
import doctorRoutes from "./routes/doctorRoutes";
import staffRoutes from "./routes/staffRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import voiceAgentRoutes from "./routes/voiceAgentRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import retailAIRoutes from "./routes/retailAIRoutes";
import retellFunctionsRoutes from "./routes/retellFunctionsRoutes";
import testCalendarRoutes from "./routes/testCalendarRoutes";
import reminderRoutes from "./routes/reminderRoutes";
import doctorStatusRoutes from "./routes/doctorStatusRoutes";
import medicalDocumentRoutes from "./routes/medicalDocumentRoutes";

const app = express();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from env or use defaults
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',') 
      : ["http://localhost:3000", "http://localhost:3001"];
    
    // Allow Retell AI domains
    const retellDomains = [
      'https://api.retellai.com',
      'https://retellai.com',
      'https://app.retellai.com'
    ];
    
    // Combine all allowed origins
    const allAllowedOrigins = [...allowedOrigins, ...retellDomains];
    
    // Check if origin is allowed
    if (allAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now (you can restrict later)
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Retell-Signature"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "MedFlow AI API is running 🚀" });
});

// Health Check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/voice-agent", voiceAgentRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/retail-ai", retailAIRoutes);
app.use("/api/retell", retellFunctionsRoutes); // Retell custom functions
app.use("/api/test", testCalendarRoutes); // Test endpoints
app.use("/api/reminders", reminderRoutes); // Appointment reminders
app.use("/api/doctor-status", doctorStatusRoutes); // Doctor status & wait times
app.use("/api/medical-documents", medicalDocumentRoutes); // Medical documents with AI

// 404 Handler - Must be AFTER all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler - Must be LAST
app.use((err: any, req: express.Request, res: express.Response) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
