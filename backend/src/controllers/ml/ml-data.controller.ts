/**
 * ML Data Collection API Controller
 */

import { Request, Response } from 'express';
import {
  collectMLSample,
  getDatasetStats,
  getSamples
} from '../../services/ml/lightweight-collector.service';
import { DataQuality } from '@prisma/client';

/**
 * POST /api/ml/collect
 * MediaPipe 데이터를 직접 전송받아 ML 샘플로 저장
 */
export async function collectSample(req: Request, res: Response) {
  try {
    const { visionSessionId, sampleData, anonymize, requireConsent } = req.body;

    if (!visionSessionId || !sampleData) {
      return res.status(400).json({
        success: false,
        error: 'visionSessionId and sampleData are required'
      });
    }

    const result = await collectMLSample(visionSessionId, sampleData, {
      anonymize: anonymize ?? true,
      requireConsent: requireConsent ?? false
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      message: 'ML sample collected successfully',
      sampleId: result.sampleId
    });

  } catch (error) {
    console.error('Error in collectSample:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * GET /api/ml/stats
 * 데이터셋 통계 조회
 */
export async function getStats(_req: Request, res: Response) {
  try {
    const stats = await getDatasetStats();

    return res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error in getStats:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * GET /api/ml/samples
 * ML 샘플 목록 조회
 */
export async function listSamples(req: Request, res: Response) {
  try {
    const {
      quality,
      ageGroup,
      minQualityScore,
      limit,
      offset
    } = req.query;

    const result = await getSamples({
      quality: quality as DataQuality | undefined,
      ageGroup: ageGroup as string | undefined,
      minQualityScore: minQualityScore ? parseFloat(minQualityScore as string) : undefined,
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0
    });

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error in listSamples:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export default {
  collectSample,
  getStats,
  listSamples
};
