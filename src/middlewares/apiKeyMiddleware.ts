import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Retell } from 'retell-sdk';
import { authMiddleware } from './authMiddleware';

/**
 * API Key Authentication Middleware
 * Validates API keys for external services (Voice Agent, Retell, Webhooks)
 */
export const apiKeyAuth = (allowedKeys: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for API key in multiple possible headers
      const apiKey = 
        req.headers['x-api-key'] as string ||
        req.headers['api-key'] as string ||
        req.headers['authorization']?.replace('Bearer ', '');

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: 'API key is required',
          error: 'Missing X-API-Key header'
        });
      }

      // Check if the provided key matches any allowed keys
      let isValidKey = false;
      
      // Only compare if keys have the same length (prevents buffer size errors)
      for (const key of allowedKeys) {
        if (apiKey.length === key.length) {
          try {
            // Constant-time comparison to prevent timing attacks
            if (crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(key))) {
              isValidKey = true;
              break;
            }
          } catch {
            // Continue to next key if comparison fails
            continue;
          }
        }
      }

      if (!isValidKey) {
        return res.status(403).json({
          success: false,
          message: 'Invalid API key',
          error: 'The provided API key is not authorized'
        });
      }

      // API key is valid, proceed
      next();
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: 'API key validation failed',
        error: error.message
      });
    }
  };
};

/**
 * Retell Signature Verification Middleware
 * Verifies that webhook requests actually come from Retell AI using official SDK
 */
export const verifyRetellSignature = (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-retell-signature'] as string;
    const retellApiKey = process.env.RETELL_API_KEY;

    // If no API key is configured, log warning but allow (for development)
    if (!retellApiKey) {
      console.warn('⚠️  RETELL_API_KEY not configured. Skipping signature verification.');
      return next();
    }

    if (!signature) {
      return res.status(401).json({
        success: false,
        message: 'Missing Retell signature',
        error: 'X-Retell-Signature header is required'
      });
    }

    // Use official Retell SDK to verify the signature
    const payload = JSON.stringify(req.body);
    
    const isValid = Retell.verify(
      payload,
      retellApiKey,
      signature
    );

    if (!isValid) {
      console.error('❌ Invalid Retell signature');
      return res.status(403).json({
        success: false,
        message: 'Invalid Retell signature',
        error: 'Signature verification failed'
      });
    }

    console.log('✅ Retell signature verified successfully');
    // Signature is valid, proceed
    next();
  } catch (error: any) {
    console.error('Retell signature verification error:', error);
    return res.status(403).json({
      success: false,
      message: 'Signature verification failed',
      error: error.message
    });
  }
};

/**
 * Combined middleware for Retell routes
 * Checks both API key and signature
 */
export const retellAuth = (req: Request, res: Response, next: NextFunction) => {
  const retellApiKey = process.env.RETELL_API_KEY;

  if (!retellApiKey) {
    console.warn('⚠️  RETELL_API_KEY not configured. Skipping API key check.');
    return verifyRetellSignature(req, res, next);
  }

  // First check API key
  apiKeyAuth([retellApiKey])(req, res, (err) => {
    if (err) return next(err);
    
    // Then verify signature
    verifyRetellSignature(req, res, next);
  });
};

/**
 * Voice Agent API Key Middleware
 */
export const voiceAgentAuth = (req: Request, res: Response, next: NextFunction) => {
  const voiceAgentKey = process.env.VOICE_AGENT_API_KEY;

  if (!voiceAgentKey) {
    console.warn('⚠️  VOICE_AGENT_API_KEY not configured. Allowing request.');
    return next();
  }

  // Debug logging
  const receivedKey = req.headers['x-api-key'] as string || req.headers['api-key'] as string;
  console.log('🔑 Received API Key:', receivedKey ? `${receivedKey.substring(0, 10)}...` : 'MISSING');
  console.log('🔑 Expected API Key:', voiceAgentKey ? `${voiceAgentKey.substring(0, 10)}...` : 'NOT SET');

  return apiKeyAuth([voiceAgentKey])(req, res, next);
};

/**
 * Webhook API Key Middleware
 */
export const webhookAuth = (req: Request, res: Response, next: NextFunction) => {
  const webhookKey = process.env.WEBHOOK_API_KEY;

  if (!webhookKey) {
    console.warn('⚠️  WEBHOOK_API_KEY not configured. Allowing request.');
    return next();
  }

  return apiKeyAuth([webhookKey])(req, res, next);
};

/**
 * Retail AI API Key Middleware (for incoming requests to our API)
 */
export const retailAIAuth = (req: Request, res: Response, next: NextFunction) => {
  const retailAIKey = process.env.RETAIL_AI_INCOMING_API_KEY;

  if (!retailAIKey) {
    console.warn('⚠️  RETAIL_AI_INCOMING_API_KEY not configured. Allowing request.');
    return next();
  }

  return apiKeyAuth([retailAIKey])(req, res, next);
};

/**
 * Combined Authentication Middleware
 * Allows EITHER API key (for Retell/Voice Agent) OR JWT token (for admin users)
 * Use this for routes that should be accessible by both external services and authenticated admins
 */
export const apiKeyOrJWT = (allowedApiKeys: string[], allowedRoles: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First, try API key authentication
    const apiKey = 
      req.headers['x-api-key'] as string ||
      req.headers['api-key'] as string;

    if (apiKey) {
      // Check if API key is valid
      let isValidKey = false;
      
      for (const key of allowedApiKeys) {
        if (apiKey.length === key.length) {
          try {
            if (crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(key))) {
              isValidKey = true;
              break;
            }
          } catch {
            continue;
          }
        }
      }

      if (isValidKey) {
        // Valid API key, allow access
        return next();
      }
    }

    // If no valid API key, try JWT authentication
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { verifyToken } = require('../utils/jwt');
        const decoded = verifyToken(token);
        req.user = decoded;

        // If roles are specified, check if user has required role
        if (allowedRoles.length > 0) {
          if (!allowedRoles.includes(decoded.role)) {
            return res.status(403).json({
              success: false,
              message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
          }
        }

        // Valid JWT, allow access
        return next();
      } catch {
        // JWT verification failed, continue to rejection
      }
    }

    // Neither API key nor JWT is valid
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'Provide either a valid API key (X-API-Key header) or JWT token (Authorization header)'
    });
  };
};

/**
 * Appointment Booking Authentication
 * Allows Retell agent (API key) or Admin users (JWT)
 */
export const appointmentBookingAuth = (req: Request, res: Response, next: NextFunction) => {
  const retellKey = process.env.RETELL_API_KEY;
  const voiceAgentKey = process.env.VOICE_AGENT_API_KEY;
  
  const allowedKeys = [retellKey, voiceAgentKey].filter(Boolean) as string[];

  if (allowedKeys.length === 0) {
    console.warn('⚠️  No API keys configured for appointment booking. Allowing request.');
    return next();
  }

  return apiKeyOrJWT(allowedKeys, ['admin'])(req, res, next);
};

/**
 * Retail AI Session Authentication
 * Allows API key OR authenticated patient/user (JWT)
 */
export const retailAISessionAuth = (req: Request, res: Response, next: NextFunction) => {
  const retailAIKey = process.env.RETAIL_AI_INCOMING_API_KEY;
  
  const allowedKeys = retailAIKey ? [retailAIKey] : [];

  if (allowedKeys.length === 0) {
    console.warn('⚠️  RETAIL_AI_INCOMING_API_KEY not configured. Checking JWT only.');
    // If no API key configured, require JWT
    return authMiddleware(req, res, next);
  }

  // Allow API key OR any authenticated user (patient, doctor, staff, admin)
  return apiKeyOrJWT(allowedKeys, ['patient', 'doctor', 'staff', 'admin'])(req, res, next);
};
