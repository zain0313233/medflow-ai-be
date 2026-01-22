# API Security Implementation Guide

## Overview
This document explains the security measures implemented to protect the MedFlow AI API endpoints.

## Security Measures Implemented

### 1. API Key Authentication
All external service endpoints now require API key authentication.

#### Protected Routes:
- **Voice Agent Routes** (`/api/voice-agent/*`)
- **Webhook Routes** (`/api/webhook/*`)
- **Retail AI Routes** (`/api/retail-ai/*`)
- **Retell Functions** (`/api/retell/*`)

#### How to Use:
Include the API key in the request header:

```bash
# Using X-API-Key header (recommended)
curl -H "X-API-Key: your_api_key_here" https://your-api.com/api/voice-agent/doctors

# Alternative: Using Authorization header
curl -H "Authorization: Bearer your_api_key_here" https://your-api.com/api/voice-agent/doctors
```

### 2. Retell Signature Verification
Webhook endpoints verify that requests actually come from Retell AI using HMAC-SHA256 signatures.

#### How It Works:
1. Retell AI signs each webhook request with your webhook secret
2. They send the signature in `X-Retell-Signature` header
3. Our server recalculates the signature and compares
4. Request is rejected if signatures don't match

#### Protected Routes:
- `POST /api/webhook/voice-agent`
- `POST /api/webhook/agent/:agentId`
- `POST /api/retell/*` (all Retell function endpoints)

### 3. User Authentication for Critical Routes
The `/api/retail-ai/call` endpoint now requires JWT authentication (logged-in user) to prevent abuse.

## Environment Variables

Add these to your `.env` file:

```env
# Voice Agent API Key
VOICE_AGENT_API_KEY=va_live_8f7d9e2a1b4c6d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2

# Retell AI Incoming API Key
RETELL_API_KEY_INCOMING=retell_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8

# Retell Webhook Secret (for signature verification)
RETELL_WEBHOOK_SECRET=webhook_secret_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2

# General Webhook API Key
WEBHOOK_API_KEY=webhook_live_2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3

# Retail AI Incoming API Key
RETAIL_AI_INCOMING_API_KEY=retail_live_3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4
```

### Generate Secure Keys:
```bash
# Generate a random 32-byte hex key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Configuring External Services

### Retell AI Configuration

1. **Set API Key in Retell Dashboard:**
   - Go to Retell AI Dashboard → Settings → API Keys
   - Copy your API key to `RETELL_API_KEY_INCOMING` in `.env`

2. **Configure Webhook:**
   - Go to Retell AI Dashboard → Webhooks
   - Set webhook URL: `https://your-api.com/api/webhook/voice-agent`
   - Add custom header: `X-API-Key: your_webhook_api_key`
   - Copy webhook secret to `RETELL_WEBHOOK_SECRET` in `.env`

3. **Configure Custom Functions:**
   - In your Retell agent configuration, add custom functions
   - Set function URLs to: `https://your-api.com/api/retell/function-name`
   - Add header: `X-API-Key: your_retell_api_key`

### Voice Agent Configuration

If using a custom voice agent:
1. Configure the agent to include API key in requests
2. Add header: `X-API-Key: your_voice_agent_api_key`
3. Use the key from `VOICE_AGENT_API_KEY` in `.env`

## Testing the Security

### Test API Key Authentication:

```bash
# Should fail (no API key)
curl -X GET https://your-api.com/api/voice-agent/doctors

# Should succeed
curl -X GET https://your-api.com/api/voice-agent/doctors \
  -H "X-API-Key: va_live_8f7d9e2a1b4c6d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2"
```

### Test Retell Signature Verification:

```bash
# Calculate signature
PAYLOAD='{"event":"call.started","call_id":"123"}'
SECRET="your_webhook_secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# Make request with signature
curl -X POST https://your-api.com/api/webhook/voice-agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_webhook_api_key" \
  -H "X-Retell-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

## Security Best Practices

1. **Keep API Keys Secret:**
   - Never commit `.env` file to git
   - Use different keys for development and production
   - Rotate keys regularly

2. **Monitor API Usage:**
   - Check logs for failed authentication attempts
   - Set up alerts for suspicious activity

3. **Use HTTPS:**
   - Always use HTTPS in production
   - API keys sent over HTTP can be intercepted

4. **Key Rotation:**
   - Change API keys every 90 days
   - Update keys in all services when rotating

## Troubleshooting

### "API key is required" Error
- Check that you're including the `X-API-Key` header
- Verify the header name is correct (case-sensitive)

### "Invalid API key" Error
- Verify the API key matches the one in `.env`
- Check for extra spaces or newlines in the key
- Ensure you're using the correct key for the endpoint

### "Invalid Retell signature" Error
- Verify `RETELL_WEBHOOK_SECRET` matches Retell dashboard
- Check that request body hasn't been modified
- Ensure Content-Type is `application/json`

### "Missing Retell signature" Error
- Add `X-Retell-Signature` header to webhook requests
- Configure Retell to send signatures in dashboard

## Development Mode

If keys are not configured, the middleware will log warnings but allow requests:
```
⚠️  VOICE_AGENT_API_KEY not configured. Allowing request.
```

**Important:** Always configure keys in production!

## Next Steps (Phase 2 & 3)

- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Set up IP whitelisting for webhooks
- [ ] Add monitoring and alerting
- [ ] Implement API key rotation system

## Support

For issues or questions, contact the development team.
