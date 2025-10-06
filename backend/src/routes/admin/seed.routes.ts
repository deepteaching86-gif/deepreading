// Admin seed routes
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as seedController from '../../controllers/admin/seed.controller';

const router = Router();

// Run database seed (admin only)
router.post('/run', authenticateToken, seedController.runSeed);

export default router;
