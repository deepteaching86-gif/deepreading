import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as studentsController from '../../controllers/students/students.controller';

const router = Router();

// Get current student profile
router.get('/me/profile', authenticateToken, studentsController.getMyProfile);

// Get current student statistics
router.get('/me/stats', authenticateToken, studentsController.getMyStats);

export default router;
