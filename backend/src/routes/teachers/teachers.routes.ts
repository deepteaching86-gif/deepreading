import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as teachersController from '../../controllers/teachers/teachers.controller';

const router = Router();

// Get teacher's students
router.get('/me/students', authenticateToken, teachersController.getMyStudents);

// Get class statistics
router.get('/me/class-stats', authenticateToken, teachersController.getClassStats);

// Get specific student's details
router.get('/students/:studentId/details', authenticateToken, teachersController.getStudentDetails);

export default router;
