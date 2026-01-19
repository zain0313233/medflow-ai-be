import { Router } from 'express';
import retailAIController from '../controllers/retailAIController';

const router = Router();

// Test agent connection
router.get('/test', retailAIController.testAgentConnection.bind(retailAIController));

// Get agent status
router.get('/status', retailAIController.getAgentStatus.bind(retailAIController));

// Trigger voice call to phone number
router.post('/call', retailAIController.triggerVoiceCall.bind(retailAIController));

// Process web audio
router.post('/audio', retailAIController.processWebAudio.bind(retailAIController));

// Start web conversation session
router.post('/session', retailAIController.startWebConversation.bind(retailAIController));

export default router;