// Test sessions routes
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as sessionsController from '../../controllers/sessions/sessions.controller';
import * as surveyController from '../../controllers/sessions/survey.controller';

const router = Router();

// Get user's sessions
router.get('/my', authenticateToken, sessionsController.getMySessions);

// Get session result
router.get('/:id/result', authenticateToken, sessionsController.getSessionResult);

// Get session by ID
router.get('/:id', authenticateToken, sessionsController.getSessionById);

// Start new session (using templateId)
router.post('/start', authenticateToken, sessionsController.startSession);

// Create new session (using templateCode)
router.post('/', authenticateToken, sessionsController.createSession);

// Save answers (temporary save)
router.post('/:id/answers', authenticateToken, sessionsController.saveAnswers);

// Submit test session (final submission)
router.post('/:id/submit', authenticateToken, sessionsController.submitSession);

// Update session status
router.patch('/:id/status', authenticateToken, sessionsController.updateSessionStatus);

// Delete session
router.delete('/:id', authenticateToken, sessionsController.deleteSession);

// Survey routes
router.get('/:id/survey', authenticateToken, surveyController.getSurveyQuestions);
router.post('/:id/survey', authenticateToken, surveyController.submitSurveyResponses);
router.get('/:id/survey/responses', authenticateToken, surveyController.getSurveyResponses);

export default router;
