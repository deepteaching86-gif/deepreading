/**
 * ML Data Collection Routes
 *
 * ML 학습 데이터 수집 API 라우트
 *
 * @module routes/ml-routes
 */

import { Router } from 'express';
import {
  collectSample,
  getStats,
  listSamples
} from '../controllers/ml/ml-data.controller';

const router = Router();

/**
 * POST /api/ml/collect
 * Vision Test Session에서 ML 샘플 수집
 *
 * Body:
 * - sessionId: string (required)
 * - requireConsent: boolean (optional, default: false)
 * - anonymize: boolean (optional, default: true)
 * - minQualityScore: number (optional, default: 0.70)
 */
router.post('/collect', collectSample);

/**
 * GET /api/ml/stats
 * 데이터셋 통계 조회
 *
 * Response:
 * - totalSamples: number
 * - qualityDistribution: Record<DataQuality, number>
 * - ageDistribution: Record<string, number>
 * - avgQualityScore: number
 * - estimatedSize: { kb, mb, samples }
 */
router.get('/stats', getStats);

/**
 * GET /api/ml/samples
 * ML 샘플 목록 조회
 *
 * Query:
 * - quality: DataQuality (optional)
 * - ageGroup: string (optional)
 * - minQualityScore: number (optional)
 * - limit: number (optional, default: 100)
 * - offset: number (optional, default: 0)
 */
router.get('/samples', listSamples);

export default router;
