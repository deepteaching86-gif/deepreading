import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as reportController from '../controllers/report.controller';

const router = Router();

// 상세 레포트 조회
router.get('/results/:resultId/detailed', authenticateToken, reportController.generateDetailedReport);

export default router;
