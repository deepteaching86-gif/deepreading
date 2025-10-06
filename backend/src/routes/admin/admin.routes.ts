import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as adminController from '../../controllers/admin/admin.controller';

const router = Router();

// Admin dashboard statistics
router.get('/dashboard/stats', authenticateToken, adminController.getDashboardStats);

// Recent user registrations
router.get('/users/recent', authenticateToken, adminController.getRecentUsers);

// Grade-level statistics
router.get('/stats/by-grade', authenticateToken, adminController.getStatsByGrade);

export default router;
