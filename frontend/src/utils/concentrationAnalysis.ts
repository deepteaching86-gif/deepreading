// 7차원 집중력 분석 알고리즘
// Multi-dimensional Concentration Analysis Algorithms

import {
  ConcentrationRawData,
  ConcentrationDimensions,
  ConcentrationScore,
  ConcentrationState,
  DimensionWeights,
  DEFAULT_WEIGHTS
} from '../types/concentration.types';

/**
 * 시간 윈도우 내 데이터 버퍼
 * 과거 5초간의 데이터를 유지하여 패턴 분석
 */
class DataBuffer {
  private buffer: ConcentrationRawData[] = [];
  private readonly maxSize = 150; // 30 FPS × 5초

  add(data: ConcentrationRawData): void {
    this.buffer.push(data);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getRecent(count: number): ConcentrationRawData[] {
    return this.buffer.slice(-count);
  }

  getAll(): ConcentrationRawData[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }

  get length(): number {
    return this.buffer.length;
  }
}

/**
 * 집중력 분석기 클래스
 */
export class ConcentrationAnalyzer {
  private dataBuffer = new DataBuffer();
  private lastBlinkTime = 0;
  private blinkCount = 0;
  // Reserved for future use
  // private lastFixationPoint: { x: number; y: number } | null = null;
  // private fixationStartTime = 0;

  /**
   * 새 데이터 추가 및 집중력 점수 계산
   */
  analyze(rawData: ConcentrationRawData, weights: DimensionWeights = DEFAULT_WEIGHTS): ConcentrationScore {
    this.dataBuffer.add(rawData);

    const dimensions: ConcentrationDimensions = {
      pupilDynamics: this.analyzePupilDynamics(),
      blinkPattern: this.analyzeBlinkPattern(rawData),
      gazeStability: this.analyzeGazeStability(),
      microsaccades: this.detectMicrosaccades(),
      headMovement: this.analyzeHeadMovement(),
      readingRhythm: this.analyzeReadingRhythm(rawData),
      taskEngagement: this.measureTaskEngagement(rawData)
    };

    // 가중 평균으로 총점 계산
    const totalScore = this.calculateWeightedScore(dimensions, weights);

    // 집중 상태 분류
    const state = this.classifyState(totalScore, dimensions);

    return {
      totalScore,
      dimensions,
      timestamp: rawData.timestamp,
      state
    };
  }

  /**
   * 차원 1: 동공 역학 (Pupil Dynamics)
   * TEPR (Task-Evoked Pupillary Response), FFT 분석
   */
  private analyzePupilDynamics(): number {
    const data = this.dataBuffer.getAll();
    if (data.length < 30) return 50; // 초기값

    const pupilSizes = data.map(d => d.pupilSize);

    // 1. 동공 크기 변화율 (집중 시 증가)
    const variance = this.calculateVariance(pupilSizes);
    const varianceScore = Math.min(100, variance * 5000); // 정규화

    // 2. 동공 크기 평균 (적정 범위 0.4-0.6)
    const mean = this.calculateMean(pupilSizes);
    const meanScore = 100 - Math.abs(mean - 0.5) * 200;

    // 3. 주파수 분석 (0.5-2 Hz 범위 활동성)
    const fftScore = this.analyzePupilFrequency(pupilSizes);

    return (varianceScore * 0.3 + meanScore * 0.4 + fftScore * 0.3);
  }

  /**
   * 차원 2: 깜박임 패턴 (Blink Pattern)
   * 억제율, 규칙성 분석
   */
  private analyzeBlinkPattern(rawData: ConcentrationRawData): number {
    const EAR_THRESHOLD = 0.2; // Eye Aspect Ratio 임계값
    const now = rawData.timestamp;

    // 깜박임 감지
    if (rawData.eyeAspectRatio < EAR_THRESHOLD) {
      if (now - this.lastBlinkTime > 200) { // 최소 200ms 간격
        this.blinkCount++;
        this.lastBlinkTime = now;
      }
    }

    const data = this.dataBuffer.getRecent(900); // 최근 30초
    if (data.length < 300) return 50;

    // 1. 깜박임 빈도 (정상: 분당 15-20회)
    const duration = (data[data.length - 1].timestamp - data[0].timestamp) / 1000;
    const blinkRate = (this.blinkCount / duration) * 60;
    const rateScore = 100 - Math.abs(blinkRate - 17.5) * 10; // 17.5가 최적

    // 2. 깜박임 억제율 (집중 시 감소)
    const suppressionScore = Math.max(0, 100 - blinkRate * 3);

    // 3. 깜박임 규칙성 (일정한 간격)
    const blinkIntervals = this.calculateBlinkIntervals(data);
    const regularityScore = 100 - this.calculateCV(blinkIntervals) * 100;

    return Math.max(0, Math.min(100,
      rateScore * 0.4 + suppressionScore * 0.3 + regularityScore * 0.3
    ));
  }

  /**
   * 차원 3: 시선 안정성 (Gaze Stability)
   * 드리프트, 분산도 측정
   */
  private analyzeGazeStability(): number {
    const data = this.dataBuffer.getRecent(90); // 최근 3초
    if (data.length < 30) return 50;

    const gazeVectors = data.map(d => d.gazeVector);

    // 1. 시선 위치 분산 (낮을수록 안정적)
    const xPositions = gazeVectors.map(v => v.x);
    const yPositions = gazeVectors.map(v => v.y);
    const varianceX = this.calculateVariance(xPositions);
    const varianceY = this.calculateVariance(yPositions);
    const varianceScore = 100 - (varianceX + varianceY) * 1000;

    // 2. 드리프트 측정 (느린 표류 감지)
    const driftScore = this.calculateDrift(gazeVectors);

    // 3. 주시 안정성 (진동 최소화)
    const stabilityScore = this.calculateStability(gazeVectors);

    return Math.max(0, Math.min(100,
      varianceScore * 0.3 + driftScore * 0.3 + stabilityScore * 0.4
    ));
  }

  /**
   * 차원 4: 미세 단속운동 (Microsaccades)
   * 빈도, 방향 엔트로피 분석
   */
  private detectMicrosaccades(): number {
    const data = this.dataBuffer.getRecent(90); // 3초
    if (data.length < 30) return 50;

    const velocities = data.map(d => d.eyeMovementVelocity);

    // 1. 미세 단속운동 빈도 (정상: 초당 1-2회)
    const microsaccadeCount = velocities.filter(v => v > 0.05 && v < 0.3).length;
    const frequencyScore = Math.min(100, microsaccadeCount * 2);

    // 2. 방향 다양성 (엔트로피)
    const directions = this.calculateMicrosaccadeDirections(data);
    const entropyScore = this.calculateDirectionEntropy(directions);

    // 3. 규칙성 (집중 시 규칙적)
    const regularityScore = 100 - this.calculateCV(velocities) * 100;

    return Math.max(0, Math.min(100,
      frequencyScore * 0.4 + entropyScore * 0.3 + regularityScore * 0.3
    ));
  }

  /**
   * 차원 5: 머리 움직임 (Head Movement)
   * 안정성, VOR (Vestibulo-Ocular Reflex) 분석
   */
  private analyzeHeadMovement(): number {
    const data = this.dataBuffer.getRecent(90); // 3초
    if (data.length < 30) return 50;

    const headPoses = data.map(d => d.headPose);

    // 1. 머리 자세 안정성 (변화량 최소화)
    const yawVariance = this.calculateVariance(headPoses.map(h => h.yaw));
    const pitchVariance = this.calculateVariance(headPoses.map(h => h.pitch));
    const rollVariance = this.calculateVariance(headPoses.map(h => h.roll));
    const stabilityScore = 100 - (yawVariance + pitchVariance + rollVariance) * 500;

    // 2. VOR 보상 품질 (머리 움직임 vs 시선 안정성)
    const vorScore = this.calculateVORQuality(data);

    // 3. 자세 정렬 (정면 응시 유지)
    const alignmentScore = this.calculatePostureAlignment(headPoses);

    return Math.max(0, Math.min(100,
      stabilityScore * 0.4 + vorScore * 0.3 + alignmentScore * 0.3
    ));
  }

  /**
   * 차원 6: 읽기 리듬 (Reading Rhythm)
   * 일관성, 변동계수 분석
   */
  private analyzeReadingRhythm(_rawData: ConcentrationRawData): number {
    const data = this.dataBuffer.getAll();
    if (data.length < 90) return 50;

    // 주시점 변화 추적
    const fixations = data.filter(d => d.fixationPoint !== null);
    if (fixations.length < 10) return 50;

    // 1. 주시 지속 시간 일관성
    const fixationDurations = this.calculateFixationDurations(fixations);
    const durationCV = this.calculateCV(fixationDurations);
    const consistencyScore = 100 - durationCV * 100;

    // 2. 읽기 속도 안정성 (단어/초)
    const readingRate = this.estimateReadingRate(fixations);
    const rateScore = Math.min(100, readingRate * 20); // 정규화

    // 3. 순차적 진행 (역행 최소화)
    const progressionScore = this.analyzeReadingProgression(fixations);

    return Math.max(0, Math.min(100,
      consistencyScore * 0.4 + rateScore * 0.3 + progressionScore * 0.3
    ));
  }

  /**
   * 차원 7: 과제 몰입도 (Task Engagement)
   * 체류 시간, 이탈 패턴 분석
   */
  private measureTaskEngagement(_rawData: ConcentrationRawData): number {
    const data = this.dataBuffer.getAll();
    if (data.length < 30) return 50;

    // 1. 화면 내 체류율
    const onScreenCount = data.filter(d => d.fixationPoint !== null).length;
    const retentionScore = (onScreenCount / data.length) * 100;

    // 2. 주의 이탈 빈도 (낮을수록 좋음)
    const distractionCount = this.countDistractions(data);
    const focusScore = Math.max(0, 100 - distractionCount * 10);

    // 3. 과제 지속성 (중단 없이 유지)
    const persistenceScore = this.calculatePersistence(data);

    return Math.max(0, Math.min(100,
      retentionScore * 0.4 + focusScore * 0.3 + persistenceScore * 0.3
    ));
  }

  // ===== 유틸리티 함수들 =====

  private calculateWeightedScore(dimensions: ConcentrationDimensions, weights: DimensionWeights): number {
    return Math.round(
      dimensions.pupilDynamics * weights.pupilDynamics +
      dimensions.blinkPattern * weights.blinkPattern +
      dimensions.gazeStability * weights.gazeStability +
      dimensions.microsaccades * weights.microsaccades +
      dimensions.headMovement * weights.headMovement +
      dimensions.readingRhythm * weights.readingRhythm +
      dimensions.taskEngagement * weights.taskEngagement
    );
  }

  private classifyState(totalScore: number, dimensions: ConcentrationDimensions): ConcentrationState {
    // 졸음 감지 (깜박임 + 머리 움직임)
    if (dimensions.blinkPattern < 30 && dimensions.headMovement < 40) {
      return ConcentrationState.DROWSY;
    }

    if (totalScore >= 70) return ConcentrationState.HIGH;
    if (totalScore >= 40) return ConcentrationState.MEDIUM;
    return ConcentrationState.LOW;
  }

  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    const mean = this.calculateMean(values);
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    return this.calculateMean(squareDiffs);
  }

  private calculateCV(values: number[]): number {
    const mean = this.calculateMean(values);
    if (mean === 0) return 0;
    const stdDev = Math.sqrt(this.calculateVariance(values));
    return stdDev / mean;
  }

  private analyzePupilFrequency(pupilSizes: number[]): number {
    // 간단한 FFT 근사 - 고주파 노이즈 제거
    const smoothed = this.movingAverage(pupilSizes, 5);
    const changes = smoothed.slice(1).map((v, i) => Math.abs(v - smoothed[i]));
    const activity = this.calculateMean(changes);
    return Math.min(100, activity * 2000);
  }

  private calculateBlinkIntervals(data: ConcentrationRawData[]): number[] {
    const intervals: number[] = [];
    let lastBlinkIdx = -1;

    data.forEach((d, i) => {
      if (d.eyeAspectRatio < 0.2) {
        if (lastBlinkIdx >= 0) {
          intervals.push(i - lastBlinkIdx);
        }
        lastBlinkIdx = i;
      }
    });

    return intervals.length > 0 ? intervals : [30]; // 기본값
  }

  private calculateDrift(gazeVectors: Array<{ x: number; y: number }>): number {
    if (gazeVectors.length < 30) return 50;

    const recentMean = this.calculateMean(gazeVectors.slice(-30).map(v => v.x));
    const overallMean = this.calculateMean(gazeVectors.map(v => v.x));
    const drift = Math.abs(recentMean - overallMean);

    return Math.max(0, 100 - drift * 500);
  }

  private calculateStability(gazeVectors: Array<{ x: number; y: number }>): number {
    const velocities = gazeVectors.slice(1).map((v, i) => {
      const dx = v.x - gazeVectors[i].x;
      const dy = v.y - gazeVectors[i].y;
      return Math.sqrt(dx * dx + dy * dy);
    });

    const jitter = this.calculateVariance(velocities);
    return Math.max(0, 100 - jitter * 5000);
  }

  private calculateMicrosaccadeDirections(data: ConcentrationRawData[]): number[] {
    const directions: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const dx = data[i].gazeVector.x - data[i - 1].gazeVector.x;
      const dy = data[i].gazeVector.y - data[i - 1].gazeVector.y;
      const angle = Math.atan2(dy, dx);
      directions.push(angle);
    }

    return directions;
  }

  private calculateDirectionEntropy(directions: number[]): number {
    // 방향을 8개 섹터로 분류 (엔트로피 계산)
    const bins = new Array(8).fill(0);
    directions.forEach(angle => {
      const binIndex = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 8) % 8;
      bins[binIndex]++;
    });

    const total = directions.length;
    let entropy = 0;
    bins.forEach(count => {
      if (count > 0) {
        const p = count / total;
        entropy -= p * Math.log2(p);
      }
    });

    // 엔트로피 정규화 (0-100)
    return (entropy / Math.log2(8)) * 100;
  }

  private calculateVORQuality(data: ConcentrationRawData[]): number {
    // VOR: 머리 움직임 시 시선 안정성 유지
    const headMovements = data.slice(1).map((d, i) => {
      const prevPose = data[i].headPose;
      const currPose = d.headPose;
      return Math.abs(currPose.yaw - prevPose.yaw) + Math.abs(currPose.pitch - prevPose.pitch);
    });

    const gazeMovements = data.slice(1).map((d, i) => {
      const dx = d.gazeVector.x - data[i].gazeVector.x;
      const dy = d.gazeVector.y - data[i].gazeVector.y;
      return Math.sqrt(dx * dx + dy * dy);
    });

    // VOR가 잘 작동하면 머리 움직임에도 시선은 안정적
    const correlation = this.calculateCorrelation(headMovements, gazeMovements);
    return Math.max(0, 100 + correlation * 100); // 역상관이 이상적
  }

  private calculatePostureAlignment(headPoses: Array<{ yaw: number; pitch: number; roll: number }>): number {
    const idealYaw = 0;
    const idealPitch = 0;
    const idealRoll = 0;

    const avgYaw = this.calculateMean(headPoses.map(h => h.yaw));
    const avgPitch = this.calculateMean(headPoses.map(h => h.pitch));
    const avgRoll = this.calculateMean(headPoses.map(h => h.roll));

    const deviation = Math.abs(avgYaw - idealYaw) + Math.abs(avgPitch - idealPitch) + Math.abs(avgRoll - idealRoll);

    return Math.max(0, 100 - deviation * 50);
  }

  private calculateFixationDurations(fixations: ConcentrationRawData[]): number[] {
    const durations: number[] = [];
    let startIdx = 0;

    for (let i = 1; i < fixations.length; i++) {
      const prev = fixations[i - 1].fixationPoint;
      const curr = fixations[i].fixationPoint;

      if (!prev || !curr) continue;

      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );

      if (distance > 0.1) { // 새로운 주시점
        const duration = fixations[i].timestamp - fixations[startIdx].timestamp;
        durations.push(duration);
        startIdx = i;
      }
    }

    return durations.length > 0 ? durations : [200];
  }

  private estimateReadingRate(fixations: ConcentrationRawData[]): number {
    if (fixations.length < 10) return 0;

    const duration = (fixations[fixations.length - 1].timestamp - fixations[0].timestamp) / 1000;
    const saccadeCount = this.countSaccades(fixations);

    // 대략적인 읽기 속도 (단어/초) - 단속운동 빈도 기반
    return saccadeCount / duration / 4; // 단어당 평균 4회 단속운동
  }

  private analyzeReadingProgression(fixations: ConcentrationRawData[]): number {
    let forwardCount = 0;
    let backwardCount = 0;

    for (let i = 1; i < fixations.length; i++) {
      const prev = fixations[i - 1].fixationPoint;
      const curr = fixations[i].fixationPoint;

      if (!prev || !curr) continue;

      if (curr.x > prev.x || (Math.abs(curr.x - prev.x) < 0.1 && curr.y > prev.y)) {
        forwardCount++;
      } else {
        backwardCount++;
      }
    }

    const total = forwardCount + backwardCount;
    return total > 0 ? (forwardCount / total) * 100 : 50;
  }

  private countDistractions(data: ConcentrationRawData[]): number {
    let count = 0;
    let wasOffScreen = false;

    data.forEach(d => {
      const isOffScreen = d.fixationPoint === null;
      if (isOffScreen && !wasOffScreen) {
        count++;
      }
      wasOffScreen = isOffScreen;
    });

    return count;
  }

  private calculatePersistence(data: ConcentrationRawData[]): number {
    const onScreenRuns: number[] = [];
    let currentRun = 0;

    data.forEach(d => {
      if (d.fixationPoint !== null) {
        currentRun++;
      } else {
        if (currentRun > 0) {
          onScreenRuns.push(currentRun);
          currentRun = 0;
        }
      }
    });

    if (currentRun > 0) onScreenRuns.push(currentRun);

    const avgRun = onScreenRuns.length > 0 ? this.calculateMean(onScreenRuns) : 0;
    return Math.min(100, avgRun / 3); // 정규화
  }

  private countSaccades(fixations: ConcentrationRawData[]): number {
    let count = 0;

    for (let i = 1; i < fixations.length; i++) {
      const prev = fixations[i - 1].fixationPoint;
      const curr = fixations[i].fixationPoint;

      if (!prev || !curr) continue;

      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );

      if (distance > 0.1) count++;
    }

    return count;
  }

  private movingAverage(values: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(values.length, i + Math.ceil(window / 2));
      const slice = values.slice(start, end);
      result.push(this.calculateMean(slice));
    }
    return result;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < x.length; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denom = Math.sqrt(denomX * denomY);
    return denom === 0 ? 0 : numerator / denom;
  }

  /**
   * 버퍼 초기화
   */
  reset(): void {
    this.dataBuffer.clear();
    this.lastBlinkTime = 0;
    this.blinkCount = 0;
    // Reserved fields commented out for future use
    // this.lastFixationPoint = null;
    // this.fixationStartTime = 0;
  }
}

/**
 * 싱글톤 인스턴스
 */
export const concentrationAnalyzer = new ConcentrationAnalyzer();
