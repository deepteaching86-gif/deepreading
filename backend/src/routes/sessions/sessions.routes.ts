// Test sessions routes
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as sessionsController from '../../controllers/sessions/sessions.controller';

const router = Router();

// Get user's sessions
router.get('/my', authenticateToken, sessionsController.getMySessions);

// Get session by ID
router.get('/:id', authenticateToken, sessionsController.getSessionById);

// Create new session
router.post('/', authenticateToken, sessionsController.createSession);

// Update session status
router.patch('/:id/status', authenticateToken, sessionsController.updateSessionStatus);

export default router;
