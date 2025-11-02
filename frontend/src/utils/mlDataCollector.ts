/**
 * ML Data Collector Utility
 *
 * MediaPipe 데이터를 수집하여 ML 학습용 샘플로 변환
 */

import axios from '../lib/axios';

export interface MLSampleData {
  // 메타데이터
  ageGroup: string;
  gender?: string;
  wearsGlasses?: boolean;
  deviceType: string;
  screenResolution?: string;

  // 특징 벡터 (MediaPipe에서 추출)
  irisLandmarks: any;
  faceLandmarks: any;
  headPose: any;
  calibrationPoints: any;
  pupilDiameters?: { left: number | null; right: number | null };

  // 품질
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  qualityScore: number;
  qualityNotes?: string;
}

/**
 * 얼굴 랜드마크 압축 (478 → 68 points)
 */
const FACE_LANDMARK_KEYPOINTS = [
  // 얼굴 윤곽 (17 points)
  0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160,
  // 왼쪽 눈썹 (5 points)
  70, 63, 105, 66, 107,
  // 오른쪽 눈썹 (5 points)
  336, 296, 334, 293, 300,
  // 코 (9 points)
  1, 2, 98, 327, 168, 6, 197, 195, 5,
  // 왼쪽 눈 (6 points)
  33, 133, 160, 159, 158, 144,
  // 오른쪽 눈 (6 points)
  362, 263, 387, 386, 385, 373,
  // 입 (20 points)
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375,
  291, 409, 270, 269, 267, 0, 37, 39, 40, 185
];

/**
 * 얼굴 랜드마크 압축
 */
export function compressFaceLandmarks(faceLandmarks: any[]): any {
  if (!faceLandmarks || faceLandmarks.length < 478) {
    console.warn('Invalid face landmarks for compression');
    return {
      keypoints: [],
      indices: FACE_LANDMARK_KEYPOINTS,
      compressionRatio: 0
    };
  }

  const keypoints = FACE_LANDMARK_KEYPOINTS.map(index => faceLandmarks[index]);

  return {
    keypoints,
    indices: FACE_LANDMARK_KEYPOINTS,
    compressionRatio: keypoints.length / faceLandmarks.length
  };
}

/**
 * 품질 평가
 * 캘리브레이션 정확도 + 머리 자세 안정성 + 홍채 검출 신뢰도
 */
export function assessQuality(
  calibrationPoints: any[],
  headPose: { pitch: number; yaw: number; roll: number },
  irisLandmarks: any[]
): { quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'; score: number; notes: string } {
  const notes: string[] = [];
  let totalScore = 0;
  let weights = 0;

  // 1. 캘리브레이션 정확도 (40%)
  if (calibrationPoints && calibrationPoints.length >= 5) {
    const avgError = calibrationPoints.reduce((sum, p) => sum + (p.error || 0), 0) / calibrationPoints.length;
    const calibrationScore = Math.max(0, 1 - avgError / 100); // 100px 오차 = 0점
    totalScore += calibrationScore * 0.4;
    weights += 0.4;

    if (avgError < 20) notes.push('Excellent calibration');
    else if (avgError < 50) notes.push('Good calibration');
    else notes.push('Poor calibration');
  }

  // 2. 머리 자세 안정성 (30%)
  if (headPose) {
    const pitch = Math.abs(headPose.pitch || 0);
    const yaw = Math.abs(headPose.yaw || 0);
    const roll = Math.abs(headPose.roll || 0);

    const poseScore = Math.max(0, 1 - (pitch + yaw + roll) / 90); // 90도 = 0점
    totalScore += poseScore * 0.3;
    weights += 0.3;

    if (pitch < 10 && yaw < 10 && roll < 5) notes.push('Stable head');
    else if (pitch < 20 && yaw < 20 && roll < 10) notes.push('Moderate movement');
    else notes.push('Unstable head');
  }

  // 3. 홍채 검출 신뢰도 (30%)
  if (irisLandmarks && irisLandmarks.length > 0) {
    const avgConfidence = irisLandmarks.reduce((sum: number, p: any) =>
      sum + (p.visibility || p.z || 0.9), 0) / irisLandmarks.length;
    totalScore += Math.min(1, avgConfidence) * 0.3;
    weights += 0.3;

    if (avgConfidence > 0.95) notes.push('Excellent iris');
    else if (avgConfidence > 0.85) notes.push('Good iris');
    else notes.push('Poor iris');
  }

  const finalScore = weights > 0 ? totalScore / weights : 0;

  // 품질 등급 결정
  let quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  if (finalScore >= 0.95) quality = 'EXCELLENT';
  else if (finalScore >= 0.85) quality = 'GOOD';
  else if (finalScore >= 0.70) quality = 'FAIR';
  else quality = 'POOR';

  return {
    quality,
    score: finalScore,
    notes: notes.join(', ')
  };
}

/**
 * 사용자 연령대 추출
 */
export function getUserAgeGroup(): string {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return 'unknown';

    const parsed = JSON.parse(authStorage);
    const user = parsed.state?.user;

    if (!user?.birthDate) return 'unknown';

    const birthDate = new Date(user.birthDate);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    if (age >= 8 && age <= 10) return '8-10';
    if (age >= 11 && age <= 13) return '11-13';
    if (age >= 14 && age <= 15) return '14-15';
    return 'other';
  } catch (error) {
    console.error('Error getting age group:', error);
    return 'unknown';
  }
}

/**
 * ML 샘플 데이터 수집
 */
export async function collectMLSample(
  visionSessionId: string,
  mediaPipeData: {
    faceLandmarks: any[];
    irisLandmarks: any[];
    headPose: { pitch: number; yaw: number; roll: number };
  },
  calibrationPoints: any[]
): Promise<{ success: boolean; sampleId?: string; error?: string }> {
  try {
    // 1. 얼굴 랜드마크 압축
    const compressedFace = compressFaceLandmarks(mediaPipeData.faceLandmarks);

    // 2. 품질 평가
    const qualityAssessment = assessQuality(
      calibrationPoints,
      mediaPipeData.headPose,
      mediaPipeData.irisLandmarks
    );

    // 품질이 너무 낮으면 수집하지 않음
    if (qualityAssessment.score < 0.70) {
      console.log('Quality too low for ML collection:', qualityAssessment.score);
      return { success: false, error: 'Quality below threshold' };
    }

    // 3. ML 샘플 데이터 생성
    const sampleData: MLSampleData = {
      // 메타데이터
      ageGroup: getUserAgeGroup(),
      deviceType: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,

      // 특징 벡터
      irisLandmarks: mediaPipeData.irisLandmarks,
      faceLandmarks: compressedFace,
      headPose: mediaPipeData.headPose,
      calibrationPoints: calibrationPoints,

      // 품질
      quality: qualityAssessment.quality,
      qualityScore: qualityAssessment.score,
      qualityNotes: qualityAssessment.notes
    };

    // 4. API 전송
    const response = await axios.post('/ml/collect', {
      visionSessionId,
      sampleData,
      anonymize: true
    });

    console.log('✅ ML sample collected:', response.data.sampleId);

    return {
      success: true,
      sampleId: response.data.sampleId
    };

  } catch (error: any) {
    console.error('❌ Failed to collect ML sample:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * 데이터셋 통계 조회
 */
export async function getMLStats() {
  try {
    const response = await axios.get('/ml/stats');
    return response.data.stats;
  } catch (error) {
    console.error('Failed to get ML stats:', error);
    return null;
  }
}

export default {
  compressFaceLandmarks,
  assessQuality,
  getUserAgeGroup,
  collectMLSample,
  getMLStats
};
