// Adaptive Frame Skip
// Intelligently skip frames based on movement to reduce processing load

export interface FrameSkipConfig {
  baseInterval: number;          // 기본 스킵 간격 (default: 1 = 모든 프레임 처리)
  maxInterval: number;           // 최대 스킵 간격 (default: 3)
  highVelocityThreshold: number; // 빠른 움직임 임계값 (default: 0.1)
  medVelocityThreshold: number;  // 중간 움직임 임계값 (default: 0.05)
  enableAdaptive: boolean;       // 적응형 모드 활성화 (default: true)
}

export interface FrameSkipStats {
  totalFrames: number;
  processedFrames: number;
  skippedFrames: number;
  currentInterval: number;
  avgInterval: number;
}

const DEFAULT_CONFIG: FrameSkipConfig = {
  baseInterval: 1,
  maxInterval: 3,
  highVelocityThreshold: 0.1,
  medVelocityThreshold: 0.05,
  enableAdaptive: true
};

export class AdaptiveFrameSkipper {
  private config: FrameSkipConfig;
  private stats: FrameSkipStats = {
    totalFrames: 0,
    processedFrames: 0,
    skippedFrames: 0,
    currentInterval: 1,
    avgInterval: 1
  };

  private currentInterval: number = 1;
  private frameCounter: number = 0;

  constructor(config: Partial<FrameSkipConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentInterval = this.config.baseInterval;
    console.log('🎯 AdaptiveFrameSkipper initialized:', this.config);
  }

  /**
   * 현재 프레임을 처리할지 결정
   * @param gazeVelocity - 시선 이동 속도 (normalized, 0-1)
   * @param faceMovementVelocity - 얼굴 움직임 속도 (normalized, 0-1)
   * @returns true이면 처리, false이면 스킵
   */
  shouldProcess(
    gazeVelocity: number,
    faceMovementVelocity: number
  ): boolean {
    this.stats.totalFrames++;
    this.frameCounter++;

    // 적응형 모드가 비활성화되면 항상 처리
    if (!this.config.enableAdaptive) {
      this.stats.processedFrames++;
      return true;
    }

    // 스킵 간격 동적 조정
    this.updateInterval(gazeVelocity, faceMovementVelocity);

    // 현재 프레임이 처리 대상인지 확인
    const shouldProcess = this.frameCounter % this.currentInterval === 0;

    if (shouldProcess) {
      this.stats.processedFrames++;
      // 통계 업데이트 (EMA)
      this.stats.avgInterval =
        this.stats.avgInterval * 0.9 + this.currentInterval * 0.1;
    } else {
      this.stats.skippedFrames++;
    }

    return shouldProcess;
  }

  /**
   * 움직임 속도에 따라 스킵 간격 동적 조정
   */
  private updateInterval(
    gazeVelocity: number,
    faceMovementVelocity: number
  ): void {
    const maxVelocity = Math.max(gazeVelocity, faceMovementVelocity);

    // 빠른 움직임: 모든 프레임 처리
    if (maxVelocity > this.config.highVelocityThreshold) {
      this.currentInterval = 1;
      this.stats.currentInterval = 1;
      return;
    }

    // 중간 움직임: 2프레임마다 처리
    if (maxVelocity > this.config.medVelocityThreshold) {
      this.currentInterval = 2;
      this.stats.currentInterval = 2;
      return;
    }

    // 정지 상태: 최대 간격으로 스킵
    this.currentInterval = this.config.maxInterval;
    this.stats.currentInterval = this.config.maxInterval;
  }

  /**
   * 현재 스킵 간격 반환
   */
  getCurrentInterval(): number {
    return this.currentInterval;
  }

  /**
   * 통계 조회
   */
  getStats(): FrameSkipStats {
    return { ...this.stats };
  }

  /**
   * 처리율 반환 (0-1)
   */
  getProcessingRate(): number {
    return this.stats.totalFrames > 0
      ? this.stats.processedFrames / this.stats.totalFrames
      : 1;
  }

  /**
   * 스킵율 반환 (0-1)
   */
  getSkipRate(): number {
    return this.stats.totalFrames > 0
      ? this.stats.skippedFrames / this.stats.totalFrames
      : 0;
  }

  /**
   * CPU 절감율 추정 (0-1)
   */
  getEstimatedCPUSavings(): number {
    // 스킵된 프레임 비율 = CPU 절감율
    return this.getSkipRate();
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<FrameSkipConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 FrameSkip config updated:', this.config);
  }

  /**
   * 통계 초기화
   */
  resetStats(): void {
    this.stats = {
      totalFrames: 0,
      processedFrames: 0,
      skippedFrames: 0,
      currentInterval: this.currentInterval,
      avgInterval: 1
    };
    this.frameCounter = 0;
  }

  /**
   * 강제로 다음 프레임 처리
   * (중요한 이벤트 발생 시 사용)
   */
  forceNextFrame(): void {
    this.frameCounter = this.currentInterval - 1;
  }
}

/**
 * 움직임 속도 계산 헬퍼
 * 이전 위치와 현재 위치로부터 속도 계산
 */
export function calculateVelocity(
  prevX: number,
  prevY: number,
  currX: number,
  currY: number,
  deltaTime: number // ms
): number {
  if (deltaTime === 0) return 0;

  const dx = currX - prevX;
  const dy = currY - prevY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 속도: distance / time (normalized to per second)
  return distance / (deltaTime / 1000);
}
