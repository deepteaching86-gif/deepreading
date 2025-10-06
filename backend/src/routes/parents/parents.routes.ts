import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as parentsController from '../../controllers/parents/parents.controller';

const router = Router();

// Get parent's children list
router.get('/me/children', authenticateToken, parentsController.getMyChildren);

// Get specific child's statistics
router.get('/children/:studentId/stats', authenticateToken, parentsController.getChildStats);

export default router;
