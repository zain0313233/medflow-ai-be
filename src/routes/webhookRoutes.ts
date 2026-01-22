import { Router } from 'express';
import webhookController from '../controllers/webhookController';
import { webhookAuth, verifyRetellSignature } from '../middlewares/apiKeyMiddleware';

const router = Router();

// Health check - no auth needed
router.get('/health', webhookController.webhookHealthCheck.bind(webhookController));

// Main voice agent webhook endpoint - signature verification only (Retell can't send custom headers easily)
router.post('/voice-agent', verifyRetellSignature, webhookController.handleVoiceAgentWebhook.bind(webhookController));

// Agent-specific webhook endpoint for your agent - requires API key + signature
router.post('/agent/agent_8eec7ec5373d0b2d56347fd0e8', webhookAuth, verifyRetellSignature, webhookController.handleVoiceAgentWebhook.bind(webhookController));

// Receive appointment data from voice agent - requires API key
router.post('/appointment-data', webhookAuth, webhookController.receiveAppointmentData.bind(webhookController));

// Test webhook endpoint - requires API key
router.post('/test', webhookAuth, webhookController.testWebhook.bind(webhookController));

export default router;