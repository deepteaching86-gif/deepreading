// Adaptive ROI Optimizer
// Optimizes Region of Interest (ROI) processing for better performance

export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AdaptiveROIConfig {
  basePadding: number;           // 기본 패딩 (default: 0.2)
  minPadding: number;            // 최소 패딩 (default: 0.1)
  maxPadding: number;            // 최대 패딩 (default: 0.3)
  cacheDuration: number;         // ROI 캐시 지속 시간 (프레임) (default: 5)
  downsampleScale: number;       // 다운샘플링 스케일 (default: 0.75)
  movementThreshold: number;     // 움직임 임계값 (default: 0.05)
}

export interface ROIStats {
  cacheHits: number;
  cacheMisses: number;
  avgPadding: number;
  downsampleCount: number;
}

const DEFAULT_CONFIG: AdaptiveROIConfig = {
  basePadding: 0.2,
  minPadding: 0.1,
  maxPadding: 0.3,
  cacheDuration: 5,
  downsampleScale: 0.75,
  movementThreshold: 0.05
};

export class AdaptiveROIOptimizer {
  private config: AdaptiveROIConfig;
  private stats: ROIStats = {
    cacheHits: 0,
    cacheMisses: 0,
    avgPadding: 0,
    downsampleCount: 0
  };

  // ROI 캐시
  private cachedROI: {
    left: ROI;
    right: ROI;
    timestamp: number;
    frameCount: number;
  } | null = null;

  // 감지 성공률 추적 (최근 10프레임)
  private detectionHistory: boolean[] = [];
  private maxHistorySize: number = 10;

  // 현재 패딩
  private currentPadding: number;

  constructor(config: Partial<AdaptiveROIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentPadding = this.config.basePadding;
    console.log('🎯 AdaptiveROIOptimizer initialized:', this.config);
  }

  /**
   * 적응형 패딩 계산
   * 감지 성공률이 높으면 패딩 감소, 낮으면 패딩 증가
   */
  getAdaptivePadding(detectionSuccess: boolean): number {
    // 감지 결과 기록
    this.detectionHistory.push(detectionSuccess);
    if (this.detectionHistory.length > this.maxHistorySize) {
      this.detectionHistory.shift();
    }

    // 성공률 계산
    const successCount = this.detectionHistory.filter(s => s).length;
    const successRate = successCount / this.detectionHistory.length;

    // 적응형 패딩 조정
    if (successRate > 0.8) {
      // 높은 성공률: 패딩 감소 (빠른 처리)
      this.currentPadding = Math.max(
        this.config.minPadding,
        this.currentPadding - 0.02
      );
    } else if (successRate < 0.5) {
      // 낮은 성공률: 패딩 증가 (안정성)
      this.currentPadding = Math.min(
        this.config.maxPadding,
        this.currentPadding + 0.02
      );
    }

    // 통계 업데이트
    this.stats.avgPadding =
      (this.stats.avgPadding * 0.9) + (this.currentPadding * 0.1);

    return this.currentPadding;
  }

  /**
   * ROI 캐싱 여부 결정
   * 얼굴 움직임이 적으면 이전 ROI 재사용
   */
  shouldReuseROI(faceMovementVelocity: number): boolean {
    if (!this.cachedROI) {
      return false;
    }

    // 캐시 만료 확인 (프레임 수)
    if (this.cachedROI.frameCount >= this.config.cacheDuration) {
      this.cachedROI = null;
      this.stats.cacheMisses++;
      return false;
    }

    // 움직임 임계값 확인
    if (faceMovementVelocity > this.config.movementThreshold) {
      this.cachedROI = null;
      this.stats.cacheMisses++;
      return false;
    }

    // 캐시 히트
    this.cachedROI.frameCount++;
    this.stats.cacheHits++;
    return true;
  }

  /**
   * ROI 캐시 저장
   */
  cacheROI(leftROI: ROI, rightROI: ROI): void {
    this.cachedROI = {
      left: { ...leftROI },
      right: { ...rightROI },
      timestamp: Date.now(),
      frameCount: 0
    };
  }

  /**
   * 캐시된 ROI 가져오기
   */
  getCachedROI(): { left: ROI; right: ROI } | null {
    return this.cachedROI
      ? { left: this.cachedROI.left, right: this.cachedROI.right }
      : null;
  }

  /**
   * ROI 다운샘플링
   * 처리 영역을 축소하여 연산량 감소
   */
  downsampleROI(roi: ROI): ROI {
    const scale = this.config.downsampleScale;
    const centerX = roi.x + roi.width / 2;
    const centerY = roi.y + roi.height / 2;

    const newWidth = roi.width * scale;
    const newHeight = roi.height * scale;

    this.stats.downsampleCount++;

    return {
      x: Math.floor(centerX - newWidth / 2),
      y: Math.floor(centerY - newHeight / 2),
      width: Math.floor(newWidth),
      height: Math.floor(newHeight)
    };
  }

  /**
   * 최적화된 ROI 계산
   * 적응형 패딩 + 다운샘플링 적용
   */
  calculateOptimizedROI(
    baseROI: ROI,
    detectionSuccess: boolean,
    enableDownsample: boolean = true
  ): ROI {
    // 적응형 패딩 적용
    const padding = this.getAdaptivePadding(detectionSuccess);

    const paddedROI: ROI = {
      x: Math.floor(baseROI.x - baseROI.width * padding),
      y: Math.floor(baseROI.y - baseROI.height * padding),
      width: Math.floor(baseROI.width * (1 + padding * 2)),
      height: Math.floor(baseROI.height * (1 + padding * 2))
    };

    // 다운샘플링 적용 (옵션)
    if (enableDownsample) {
      return this.downsampleROI(paddedROI);
    }

    return paddedROI;
  }

  /**
   * 통계 조회
   */
  getStats(): ROIStats {
    return { ...this.stats };
  }

  /**
   * 캐시 히트율
   */
  getCacheHitRate(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return total > 0 ? this.stats.cacheHits / total : 0;
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<AdaptiveROIConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 ROI config updated:', this.config);
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cachedROI = null;
  }

  /**
   * 통계 초기화
   */
  resetStats(): void {
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      avgPadding: 0,
      downsampleCount: 0
    };
    this.detectionHistory = [];
  }
}
