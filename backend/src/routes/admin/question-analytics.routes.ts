import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import {
  getQuestionAnalytics,
  getTemplateAnalytics,
  getQuestionDetail,
} from '../../controllers/admin/question-analytics.controller';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/v1/admin/question-analytics - Get question analytics
router.get('/', getQuestionAnalytics);

// GET /api/v1/admin/question-analytics/templates - Get template analytics summary
router.get('/templates', getTemplateAnalytics);

// GET /api/v1/admin/question-analytics/:id - Get detailed question analytics
router.get('/:id', getQuestionDetail);

export default router;
