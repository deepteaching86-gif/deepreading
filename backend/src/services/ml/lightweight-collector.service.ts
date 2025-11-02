/**
 * Lightweight ML Data Collector Service
 * 
 * 경량 ML 학습 데이터 수집 서비스
 * - 이미지 없이 특징 벡터만 저장
 * - 샘플당 2-5KB (500배 압축)
 * - 프론트엔드에서 직접 전송한 MediaPipe 데이터 저장
 */

import { PrismaClient, DataQuality, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface MLSampleData {
  // 메타데이터
  ageGroup: string;
  gender?: string;
  wearsGlasses?: boolean;
  deviceType: string;
  screenResolution?: string;
  
  // 특징 벡터 (MediaPipe에서 추출)
  irisLandmarks: any;  // 10 points per eye
  faceLandmarks: any;  // 478 → 68 compressed points
  headPose: any;       // pitch, yaw, roll
  calibrationPoints: any;  // Ground truth data
  pupilDiameters?: { left: number | null; right: number | null };
  
  // 품질
  quality: DataQuality;
  qualityScore: number;
  qualityNotes?: string;
}

/**
 * ML 샘플 직접 저장 (프론트엔드에서 전송받은 데이터)
 */
export async function collectMLSample(
  visionSessionId: string,
  sampleData: MLSampleData,
  options: { anonymize?: boolean; requireConsent?: boolean } = {}
): Promise<{ success: boolean; sampleId?: string; reason?: string }> {
  const { anonymize = true, requireConsent = false } = options;

  try {
    // Vision session 확인
    const session = await prisma.visionTestSession.findUnique({
      where: { id: visionSessionId }
    });

    if (!session) {
      return { success: false, reason: 'Session not found' };
    }

    // 동의 확인 (필요시)
    if (requireConsent && session.sessionId) {
      const testSession = await prisma.testSession.findUnique({
        where: { id: session.sessionId },
        include: { student: { select: { userId: true } } }
      });

      if (testSession?.student?.userId) {
        const consent = await prisma.mLDataConsent.findUnique({
          where: { userId: testSession.student.userId }
        });

        if (!consent || !consent.consentGiven || consent.revokedAt) {
          return { success: false, reason: 'User consent required' };
        }
      }
    }

    // ML 샘플 저장
    const sample = await prisma.mLTrainingSample.create({
      data: {
        visionSessionId,
        userId: null,  // Always anonymized for now
        
        // 메타데이터
        ageGroup: sampleData.ageGroup,
        gender: sampleData.gender || null,
        wearsGlasses: sampleData.wearsGlasses || false,
        deviceType: sampleData.deviceType,
        screenResolution: sampleData.screenResolution || null,
        
        // 특징 벡터
        irisLandmarks: sampleData.irisLandmarks as Prisma.InputJsonValue,
        faceLandmarks: sampleData.faceLandmarks as Prisma.InputJsonValue,
        headPose: sampleData.headPose as Prisma.InputJsonValue,
        calibrationPoints: sampleData.calibrationPoints as Prisma.InputJsonValue,
        pupilDiameters: (sampleData.pupilDiameters || {}) as Prisma.InputJsonValue,
        
        // 품질
        quality: sampleData.quality,
        qualityScore: sampleData.qualityScore,
        qualityNotes: sampleData.qualityNotes || null,
        
        // 프라이버시
        isAnonymized: anonymize,
        consentGiven: requireConsent
      }
    });

    return { success: true, sampleId: sample.id };

  } catch (error) {
    console.error('Error collecting ML sample:', error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 데이터셋 통계 조회
 */
export async function getDatasetStats() {
  const [
    totalSamples,
    qualityDistribution,
    ageDistribution,
    avgQualityScore
  ] = await Promise.all([
    prisma.mLTrainingSample.count(),
    prisma.mLTrainingSample.groupBy({
      by: ['quality'],
      _count: true
    }),
    prisma.mLTrainingSample.groupBy({
      by: ['ageGroup'],
      _count: true
    }),
    prisma.mLTrainingSample.aggregate({
      _avg: { qualityScore: true }
    })
  ]);

  const estimatedSizeKB = totalSamples * 3;
  const estimatedSizeMB = estimatedSizeKB / 1024;

  return {
    totalSamples,
    qualityDistribution: qualityDistribution.reduce((acc, item) => {
      acc[item.quality] = item._count;
      return acc;
    }, {} as Record<string, number>),
    ageDistribution: ageDistribution.reduce((acc, item) => {
      acc[item.ageGroup] = item._count;
      return acc;
    }, {} as Record<string, number>),
    avgQualityScore: avgQualityScore._avg.qualityScore || 0,
    estimatedSize: {
      kb: estimatedSizeKB,
      mb: estimatedSizeMB.toFixed(2),
      samples: totalSamples
    }
  };
}

/**
 * 샘플 조회 (필터링)
 */
export async function getSamples(filters: {
  quality?: DataQuality;
  ageGroup?: string;
  minQualityScore?: number;
  limit?: number;
  offset?: number;
}) {
  const {
    quality,
    ageGroup,
    minQualityScore,
    limit = 100,
    offset = 0
  } = filters;

  const where: any = {};
  if (quality) where.quality = quality;
  if (ageGroup) where.ageGroup = ageGroup;
  if (minQualityScore) where.qualityScore = { gte: minQualityScore };

  const [samples, total] = await Promise.all([
    prisma.mLTrainingSample.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ageGroup: true,
        gender: true,
        wearsGlasses: true,
        quality: true,
        qualityScore: true,
        qualityNotes: true,
        createdAt: true
      }
    }),
    prisma.mLTrainingSample.count({ where })
  ]);

  return {
    samples,
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  };
}

export default {
  collectMLSample,
  getDatasetStats,
  getSamples
};
