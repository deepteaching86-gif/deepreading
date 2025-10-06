import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as reportsController from '../../controllers/admin/reports.controller';

const router = Router();

// Get all sessions (for admin)
router.get('/sessions', authenticateToken, reportsController.getAllSessions);

// Get detailed report for a specific session
router.get('/sessions/:sessionId', authenticateToken, reportsController.getSessionReport);

export default router;
