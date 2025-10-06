import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as gradingController from '../../controllers/admin/grading.controller';

const router = Router();

// Get pending sessions for grading
router.get('/sessions/pending', authenticateToken, gradingController.getPendingSessions);

// Auto-grade a session
router.post('/sessions/:sessionId/auto-grade', authenticateToken, gradingController.autoGradeSession);

// Manual grade adjustment
router.put('/sessions/:sessionId/grade', authenticateToken, gradingController.manualGradeSession);

export default router;
