// Mat Pool - OpenCV Mat 객체 재사용 풀
// 메모리 할당/해제 비용을 줄이기 위한 객체 풀 패턴

export interface MatPoolStats {
  poolSize: number;
  cacheHits: number;
  cacheMisses: number;
  totalAllocations: number;
}

export class MatPool {
  private pool: Map<string, any[]> = new Map();
  private stats: MatPoolStats = {
    poolSize: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalAllocations: 0
  };

  private maxPoolSize: number = 20; // 최대 풀 크기
  private cv: any = null;

  constructor(cv: any, maxPoolSize: number = 20) {
    this.cv = cv;
    this.maxPoolSize = maxPoolSize;
    console.log('🎯 MatPool initialized (maxSize:', maxPoolSize, ')');
  }

  /**
   * Mat 객체 가져오기 (풀에서 재사용 또는 새로 생성)
   */
  getMat(rows: number, cols: number, type: number): any {
    if (!this.cv) {
      throw new Error('OpenCV not initialized');
    }

    const key = this.getKey(rows, cols, type);

    // 풀에서 사용 가능한 Mat 찾기
    const poolArray = this.pool.get(key);
    if (poolArray && poolArray.length > 0) {
      const mat = poolArray.pop()!;
      this.stats.poolSize--;
      this.stats.cacheHits++;
      return mat;
    }

    // 풀에 없으면 새로 생성
    this.stats.cacheMisses++;
    this.stats.totalAllocations++;
    return new this.cv.Mat(rows, cols, type);
  }

  /**
   * Mat 객체 반환 (풀에 저장)
   */
  returnMat(mat: any): void {
    if (!mat || mat.isDeleted()) {
      return;
    }

    const key = this.getKey(mat.rows, mat.cols, mat.type());
    const poolArray = this.pool.get(key) || [];

    // 풀 크기 제한 확인
    if (this.stats.poolSize >= this.maxPoolSize) {
      // 풀이 꽉 찼으면 즉시 삭제
      mat.delete();
      return;
    }

    // Mat 초기화 (데이터 클리어)
    mat.setTo(new this.cv.Scalar(0, 0, 0, 0));

    // 풀에 저장
    poolArray.push(mat);
    this.pool.set(key, poolArray);
    this.stats.poolSize++;
  }

  /**
   * 특정 크기/타입의 Mat 미리 할당
   */
  preallocate(rows: number, cols: number, type: number, count: number): void {
    if (!this.cv) {
      throw new Error('OpenCV not initialized');
    }

    console.log(`🔧 Preallocating ${count} Mats (${rows}x${cols})`);

    const key = this.getKey(rows, cols, type);
    const poolArray = this.pool.get(key) || [];

    for (let i = 0; i < count; i++) {
      if (this.stats.poolSize >= this.maxPoolSize) {
        break;
      }

      const mat = new this.cv.Mat(rows, cols, type);
      poolArray.push(mat);
      this.stats.poolSize++;
      this.stats.totalAllocations++;
    }

    this.pool.set(key, poolArray);
  }

  /**
   * 풀 전체 정리 (모든 Mat 삭제)
   */
  cleanup(): void {
    console.log('🧹 Cleaning up MatPool...');

    this.pool.forEach((poolArray) => {
      poolArray.forEach(mat => {
        try {
          if (!mat.isDeleted()) {
            mat.delete();
          }
        } catch (error) {
          console.warn('Failed to delete Mat:', error);
        }
      });
    });

    this.pool.clear();
    this.stats.poolSize = 0;

    console.log('✅ MatPool cleanup complete');
  }

  /**
   * 특정 키의 풀만 정리
   */
  cleanupKey(rows: number, cols: number, type: number): void {
    const key = this.getKey(rows, cols, type);
    const poolArray = this.pool.get(key);

    if (poolArray) {
      poolArray.forEach(mat => {
        try {
          if (!mat.isDeleted()) {
            mat.delete();
          }
        } catch (error) {
          console.warn('Failed to delete Mat:', error);
        }
      });

      this.pool.delete(key);
      this.stats.poolSize -= poolArray.length;
    }
  }

  /**
   * 통계 조회
   */
  getStats(): MatPoolStats {
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
   * 풀 상태 로깅
   */
  logStatus(): void {
    console.log('📊 MatPool Status:', {
      poolSize: this.stats.poolSize,
      maxSize: this.maxPoolSize,
      hitRate: `${(this.getCacheHitRate() * 100).toFixed(1)}%`,
      totalAllocations: this.stats.totalAllocations
    });
  }

  /**
   * Key 생성 (rows, cols, type을 조합)
   */
  private getKey(rows: number, cols: number, type: number): string {
    return `${rows}x${cols}x${type}`;
  }

  /**
   * 통계 초기화
   */
  resetStats(): void {
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
    this.stats.totalAllocations = 0;
  }
}

/**
 * Scoped Mat 사용 헬퍼
 * try-finally 패턴을 자동화
 */
export function useMat<T>(
  pool: MatPool,
  rows: number,
  cols: number,
  type: number,
  fn: (mat: any) => T
): T {
  const mat = pool.getMat(rows, cols, type);
  try {
    return fn(mat);
  } finally {
    pool.returnMat(mat);
  }
}

/**
 * 여러 Mat을 Scoped로 사용
 */
export function useMats<T>(
  pool: MatPool,
  specs: Array<{ rows: number; cols: number; type: number }>,
  fn: (mats: any[]) => T
): T {
  const mats = specs.map(spec =>
    pool.getMat(spec.rows, spec.cols, spec.type)
  );

  try {
    return fn(mats);
  } finally {
    mats.forEach(mat => pool.returnMat(mat));
  }
}
