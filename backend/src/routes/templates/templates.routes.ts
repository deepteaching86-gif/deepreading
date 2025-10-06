// Templates routes
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as templatesController from '../../controllers/templates/templates.controller';

const router = Router();

// Get all active templates
router.get('/', authenticateToken, templatesController.getAllTemplates);

// Get template by code
router.get('/:code', authenticateToken, templatesController.getTemplateByCode);

export default router;
