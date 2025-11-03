// Vertical Gaze Correction Algorithm
// Specialized correction for vertical (Y-axis) gaze tracking accuracy

export interface VerticalCorrectionConfig {
  pitchFactor: number;       // 머리 기울기 보정 계수 (default: 0.3)
  earFactor: number;         // EAR 보정 계수 (default: 0.5)
  nonlinearFactor: number;   // 비선형 보정 계수 (default: 0.2)
  enableCorrection: boolean; // 보정 활성화 여부 (default: true)
  verticalThreshold: number; // 수직 시선 판단 기준 (default: 0.3)
}

export interface VerticalCorrectionStats {
  totalCorrections: number;
  verticalGazeCount: number;
  horizontalGazeCount: number;
  avgPitchCorrection: number;
  avgEarCorrection: number;
  avgNonlinearCorrection: number;
}

const DEFAULT_CONFIG: VerticalCorrectionConfig = {
  pitchFactor: 0.3,
  earFactor: 0.5,
  nonlinearFactor: 0.2,
  enableCorrection: true,
  verticalThreshold: 0.3  // Y축 변화가 0.3 이상이면 수직 시선으로 판단
};

// Normal EAR baseline (눈을 정상적으로 뜬 상태)
const NORMAL_EAR = 0.15;

export class VerticalGazeCorrector {
  private config: VerticalCorrectionConfig;
  private stats: VerticalCorrectionStats = {
    totalCorrections: 0,
    verticalGazeCount: 0,
    horizontalGazeCount: 0,
    avgPitchCorrection: 0,
    avgEarCorrection: 0,
    avgNonlinearCorrection: 0
  };

  // 이전 gaze 위치 (수직/수평 판단용)
  private prevGaze: { x: number; y: number } | null = null;

  constructor(config: Partial<VerticalCorrectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('🎯 VerticalGazeCorrector initialized:', this.config);
  }

  /**
   * 수직 보정 적용
   * @param gazeY - 원본 Y 좌표 (0-1 normalized)
   * @param headPitch - 머리 상하 기울기 (radians or degrees)
   * @param eyeAspectRatio - EAR 값 (0-1)
   * @returns 보정된 Y 좌표
   */
  correctVertical(
    gazeY: number,
    headPitch: number,
    eyeAspectRatio: number
  ): number {
    if (!this.config.enableCorrection) {
      return gazeY;
    }

    this.stats.totalCorrections++;

    // 1. 머리 기울기 보정
    // 머리를 위로 들면 pitch > 0, 아래로 숙이면 pitch < 0
    // pitch가 양수면 실제 시선은 더 아래를 보는 것으로 보정
    const pitchCorrection = headPitch * this.config.pitchFactor;

    // 2. EAR 기반 보정
    // 눈을 위로 볼 때 EAR이 감소하므로, EAR 감소 시 Y를 위쪽으로 보정
    const earDiff = NORMAL_EAR - eyeAspectRatio;
    const earCorrection = earDiff * this.config.earFactor;

    // 3. 비선형 보정 (화면 상단/하단에서 더 큰 보정)
    // gazeY가 0.5(중앙)에서 멀어질수록 보정 강도 증가
    const deviation = gazeY - 0.5; // -0.5 ~ +0.5
    const nonlinearCorrection =
      Math.sign(deviation) *
      Math.pow(Math.abs(deviation), 1.2) *
      this.config.nonlinearFactor;

    // 4. 최종 보정된 Y 좌표
    const correctedY = gazeY + pitchCorrection - earCorrection + nonlinearCorrection;

    // 5. 범위 제한 (0-1)
    const clampedY = Math.max(0, Math.min(1, correctedY));

    // 통계 업데이트
    this.updateStats(pitchCorrection, earCorrection, nonlinearCorrection);

    // 디버그 로그 (샘플링)
    if (this.stats.totalCorrections % 120 === 0) {
      console.log('🔧 Vertical Correction:', {
        original: gazeY.toFixed(3),
        corrected: clampedY.toFixed(3),
        pitch: pitchCorrection.toFixed(3),
        ear: earCorrection.toFixed(3),
        nonlinear: nonlinearCorrection.toFixed(3)
      });
    }

    return clampedY;
  }

  /**
   * 수직 시선 여부 판단
   * @param currentX - 현재 X 좌표
   * @param currentY - 현재 Y 좌표
   * @returns true if 수직 시선, false if 수평 시선
   */
  isVerticalGaze(currentX: number, currentY: number): boolean {
    if (!this.prevGaze) {
      this.prevGaze = { x: currentX, y: currentY };
      return false;
    }

    // X축 변화량과 Y축 변화량 비교
    const deltaX = Math.abs(currentX - this.prevGaze.x);
    const deltaY = Math.abs(currentY - this.prevGaze.y);

    this.prevGaze = { x: currentX, y: currentY };

    // Y축 변화량이 X축보다 크고, threshold를 초과하면 수직 시선
    const isVertical =
      deltaY > deltaX && deltaY > this.config.verticalThreshold;

    if (isVertical) {
      this.stats.verticalGazeCount++;
    } else {
      this.stats.horizontalGazeCount++;
    }

    return isVertical;
  }

  /**
   * 동적 가중치 계산 (수직 시선일 때 3D 모델 가중치 증가)
   * @param isVertical - 수직 시선 여부
   * @returns 가중치 객체
   */
  getDynamicWeights(isVertical: boolean): {
    mediapipe: number;
    opencv: number;
    model3d: number;
  } {
    if (isVertical) {
      // 수직 방향: 3D 모델 가중치 2배 증가 (15% → 30%)
      return {
        mediapipe: 0.45, // 60% → 45%
        opencv: 0.25,    // 유지
        model3d: 0.30    // 15% → 30%
      };
    } else {
      // 수평 방향: 기본 가중치
      return {
        mediapipe: 0.60,
        opencv: 0.25,
        model3d: 0.15
      };
    }
  }

  /**
   * EAR threshold 동적 조정
   * @param baseThreshold - 기본 EAR threshold
   * @param isLookingUp - 위를 보고 있는지 여부 (gazeY < 0.3)
   * @returns 조정된 threshold
   */
  getAdjustedEARThreshold(
    baseThreshold: number,
    isLookingUp: boolean
  ): number {
    if (isLookingUp) {
      // 위를 볼 때 EAR이 자연스럽게 감소하므로 threshold를 낮춤
      return baseThreshold * 0.8; // 0.12 → 0.096
    }
    return baseThreshold;
  }

  /**
   * 통계 업데이트
   */
  private updateStats(
    pitchCorrection: number,
    earCorrection: number,
    nonlinearCorrection: number
  ): void {
    const n = this.stats.totalCorrections;

    // Running average
    this.stats.avgPitchCorrection =
      (this.stats.avgPitchCorrection * (n - 1) + Math.abs(pitchCorrection)) / n;
    this.stats.avgEarCorrection =
      (this.stats.avgEarCorrection * (n - 1) + Math.abs(earCorrection)) / n;
    this.stats.avgNonlinearCorrection =
      (this.stats.avgNonlinearCorrection * (n - 1) + Math.abs(nonlinearCorrection)) / n;
  }

  /**
   * 통계 조회
   */
  getStats(): VerticalCorrectionStats {
    return { ...this.stats };
  }

  /**
   * 통계 로그 출력
   */
  logStats(): void {
    const total =
      this.stats.verticalGazeCount + this.stats.horizontalGazeCount;
    console.log('📊 Vertical Gaze Correction Stats:', {
      totalCorrections: this.stats.totalCorrections,
      verticalGaze: `${((this.stats.verticalGazeCount / total) * 100).toFixed(1)}%`,
      horizontalGaze: `${((this.stats.horizontalGazeCount / total) * 100).toFixed(1)}%`,
      avgPitch: this.stats.avgPitchCorrection.toFixed(3),
      avgEar: this.stats.avgEarCorrection.toFixed(3),
      avgNonlinear: this.stats.avgNonlinearCorrection.toFixed(3)
    });
  }

  /**
   * 통계 리셋
   */
  resetStats(): void {
    this.stats = {
      totalCorrections: 0,
      verticalGazeCount: 0,
      horizontalGazeCount: 0,
      avgPitchCorrection: 0,
      avgEarCorrection: 0,
      avgNonlinearCorrection: 0
    };
    this.prevGaze = null;
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<VerticalCorrectionConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 Vertical correction config updated:', this.config);
  }

  /**
   * 현재 설정 조회
   */
  getConfig(): VerticalCorrectionConfig {
    return { ...this.config };
  }
}
