// Vision TEST API Routes - Simplified version

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as calibrationController from '../controllers/vision/calibration.controller';
import * as sessionController from '../controllers/vision/session.controller';
import * as metricsController from '../controllers/vision/metrics.controller';
import * as analysisController from '../controllers/vision/analysis.controller';
import * as adminController from '../controllers/vision/admin.controller';
import * as templateController from '../controllers/vision/template.controller';

const router = Router();

// ===== Calibration Endpoints =====
router.post('/calibration/check-environment', calibrationController.checkEnvironment);
router.post('/calibration/start', authenticateToken, calibrationController.startCalibration);
router.post('/calibration/record-point', authenticateToken, calibrationController.recordCalibrationPoint);
router.post('/calibration/validate', authenticateToken, calibrationController.validateCalibration);
router.get('/calibration/active/:userId', authenticateToken, calibrationController.getActiveCalibration);

// ===== Session Management Endpoints =====
router.post('/session/start', authenticateToken, sessionController.startVisionSession);
router.post('/session/save-gaze-data', authenticateToken, sessionController.saveGazeData);
router.post('/session/submit', authenticateToken, sessionController.submitVisionSession);
router.get('/session/:sessionId', authenticateToken, sessionController.getVisionSession);

// ===== Metrics Endpoints =====
router.post('/metrics/calculate', authenticateToken, metricsController.calculateMetrics);
router.get('/metrics/:sessionId', authenticateToken, metricsController.getMetrics);

// ===== AI Analysis Endpoints =====
router.post('/analysis/ai-analyze', authenticateToken, analysisController.aiAnalyze);
router.get('/analysis/:sessionId/report', authenticateToken, analysisController.getVisionReport);

// ===== Admin Endpoints =====
router.get('/admin/sessions', authenticateToken, adminController.listVisionSessions);
router.get('/admin/session/:sessionId/gaze-replay', authenticateToken, adminController.getGazeReplay);
router.post('/admin/session/:sessionId/adjust-calibration', authenticateToken, adminController.adjustCalibration);
router.get('/admin/session/:sessionId/heatmap', authenticateToken, adminController.getHeatmapData);

// ===== Template Management Endpoints =====
router.get('/templates', authenticateToken, templateController.listVisionTemplates);
router.get('/templates/:templateId', authenticateToken, templateController.getVisionTemplate);
router.post('/templates', authenticateToken, templateController.createVisionTemplate);
router.put('/templates/:templateId', authenticateToken, templateController.updateVisionTemplate);
router.delete('/templates/:templateId', authenticateToken, templateController.deleteVisionTemplate);

export default router;
