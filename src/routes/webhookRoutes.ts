import { Router } from 'express';
import webhookController from '../controllers/webhookController';

const router = Router();

// Health check for webhook
router.get('/health', webhookController.webhookHealthCheck.bind(webhookController));

// Main voice agent webhook endpoint
router.post('/voice-agent', webhookController.handleVoiceAgentWebhook.bind(webhookController));

// Agent-specific webhook endpoint for your agent
router.post('/agent/agent_41b2fe861b141729747b0c151d', webhookController.handleVoiceAgentWebhook.bind(webhookController));

// Receive appointment data from voice agent
router.post('/appointment-data', webhookController.receiveAppointmentData.bind(webhookController));

// Test webhook endpoint
router.post('/test', webhookController.testWebhook.bind(webhookController));

export default router;