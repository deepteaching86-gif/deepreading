import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as migrationController from '../controllers/migration.controller';

const router = Router();

/**
 * Migration routes
 * Protected: Admin only
 */

// Check peer statistics status
router.get(
  '/peer-stats/status',
  authenticateToken,
  migrationController.checkPeerStatisticsStatus
);

// Run peer statistics migration
router.post(
  '/peer-stats',
  authenticateToken,
  migrationController.runPeerStatisticsMigration
);

export default router;
