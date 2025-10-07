// Test sessions routes
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as sessionsController from '../../controllers/sessions/sessions.controller';

const router = Router();

// Get user's sessions
router.get('/my', authenticateToken, sessionsController.getMySessions);

// Get session result
router.get('/:id/result', authenticateToken, sessionsController.getSessionResult);

// Get session by ID
router.get('/:id', authenticateToken, sessionsController.getSessionById);

// Start new session (using templateId)
router.post('/start', authenticateToken, sessionsController.startSession);

// Create new session (using templateCode)
router.post('/', authenticateToken, sessionsController.createSession);

// Save answers (temporary save)
router.post('/:id/answers', authenticateToken, sessionsController.saveAnswers);

// Submit test session (final submission)
router.post('/:id/submit', authenticateToken, sessionsController.submitSession);

// Update session status
router.patch('/:id/status', authenticateToken, sessionsController.updateSessionStatus);

export default router;
