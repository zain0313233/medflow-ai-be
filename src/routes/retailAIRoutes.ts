import { Router } from 'express';
import retailAIController from '../controllers/retailAIController';
import { retailAIAuth, retailAISessionAuth } from '../middlewares/apiKeyMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Test agent connection - Public (no auth needed for frontend to check status)
router.get('/test', retailAIController.testAgentConnection.bind(retailAIController));

// Get agent status - Public (no auth needed for frontend to check status)
router.get('/status', retailAIController.getAgentStatus.bind(retailAIController));

// Trigger voice call to phone number - requires USER authentication (JWT) - CRITICAL!
router.post('/call', authMiddleware, retailAIController.triggerVoiceCall.bind(retailAIController));

// Process web audio - requires API key
router.post('/audio', retailAIAuth, retailAIController.processWebAudio.bind(retailAIController));

// Start web conversation session - requires API key OR authenticated user (patient can use)
router.post('/session', retailAISessionAuth, retailAIController.startWebConversation.bind(retailAIController));

export default router;