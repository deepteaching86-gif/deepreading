import { Router } from 'express';
import { register, login, getProfile } from '../../controllers/auth/auth.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/error-handler';

const router = Router();

// Public routes (wrapped with asyncHandler for proper Express 4.x async error handling)
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

// Protected routes
router.get('/profile', authenticateToken, asyncHandler(getProfile));

export default router;
