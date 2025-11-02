import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveFrameSkipper, calculateVelocity } from './adaptiveFrameSkip';

describe('AdaptiveFrameSkipper', () => {
  let skipper: AdaptiveFrameSkipper;

  beforeEach(() => {
    skipper = new AdaptiveFrameSkipper();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default config', () => {
      const defaultSkipper = new AdaptiveFrameSkipper();
      expect(defaultSkipper).toBeDefined();
      expect(defaultSkipper.getCurrentInterval()).toBe(1);
    });

    it('should accept custom config', () => {
      const customSkipper = new AdaptiveFrameSkipper({
        baseInterval: 2,
        maxInterval: 5,
        highVelocityThreshold: 0.15,
        medVelocityThreshold: 0.08
      });
      expect(customSkipper).toBeDefined();
      expect(customSkipper.getCurrentInterval()).toBe(2);
    });

    it('should initialize with adaptive mode enabled by default', () => {
      const stats = skipper.getStats();
      expect(stats.currentInterval).toBe(1);
    });
  });

  describe('Adaptive Interval Adjustment', () => {
    it('should set interval to 1 for high velocity movement (>0.1)', () => {
      // High velocity: gaze moving fast
      skipper.shouldProcess(0.15, 0.05);
      expect(skipper.getCurrentInterval()).toBe(1);

      // High velocity: face moving fast
      skipper.shouldProcess(0.05, 0.12);
      expect(skipper.getCurrentInterval()).toBe(1);
    });

    it('should set interval to 2 for medium velocity movement (0.05-0.1)', () => {
      // Medium velocity
      skipper.shouldProcess(0.07, 0.03);
      expect(skipper.getCurrentInterval()).toBe(2);
    });

    it('should set interval to max (3) for low velocity movement (<0.05)', () => {
      // Low velocity / stationary
      skipper.shouldProcess(0.02, 0.01);
      expect(skipper.getCurrentInterval()).toBe(3);
    });

    it('should use max velocity when both gaze and face are moving', () => {
      // Both moving, but gaze is faster
      skipper.shouldProcess(0.08, 0.03); // max = 0.08
      expect(skipper.getCurrentInterval()).toBe(2);

      // Face moving faster
      skipper.shouldProcess(0.03, 0.11); // max = 0.11
      expect(skipper.getCurrentInterval()).toBe(1);
    });

    it('should react immediately to velocity changes', () => {
      // Start stationary
      skipper.shouldProcess(0.01, 0.01);
      expect(skipper.getCurrentInterval()).toBe(3);

      // Sudden fast movement
      skipper.shouldProcess(0.15, 0.05);
      expect(skipper.getCurrentInterval()).toBe(1);

      // Back to stationary
      skipper.shouldProcess(0.02, 0.01);
      expect(skipper.getCurrentInterval()).toBe(3);
    });
  });

  describe('Frame Processing Logic', () => {
    it('should process every frame when interval is 1', () => {
      // Set to high velocity (interval 1)
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(skipper.shouldProcess(0.15, 0.05));
      }

      // All frames should be processed
      expect(results.every(r => r === true)).toBe(true);
    });

    it('should process every 2nd frame when interval is 2', () => {
      // Set to medium velocity (interval 2)
      const results = [];
      for (let i = 0; i < 6; i++) {
        results.push(skipper.shouldProcess(0.07, 0.03));
      }

      // Pattern: false, true, false, true, false, true
      expect(results[0]).toBe(false);
      expect(results[1]).toBe(true);
      expect(results[2]).toBe(false);
      expect(results[3]).toBe(true);
      expect(results[4]).toBe(false);
      expect(results[5]).toBe(true);
    });

    it('should process every 3rd frame when interval is 3', () => {
      // Set to low velocity (interval 3)
      const results = [];
      for (let i = 0; i < 9; i++) {
        results.push(skipper.shouldProcess(0.02, 0.01));
      }

      // Pattern: false, false, true, false, false, true, false, false, true
      expect(results[0]).toBe(false);
      expect(results[1]).toBe(false);
      expect(results[2]).toBe(true);
      expect(results[3]).toBe(false);
      expect(results[4]).toBe(false);
      expect(results[5]).toBe(true);
      expect(results[6]).toBe(false);
      expect(results[7]).toBe(false);
      expect(results[8]).toBe(true);
    });

    it('should handle interval changes mid-processing', () => {
      // Start with high velocity (interval 1)
      expect(skipper.shouldProcess(0.15, 0.05)).toBe(true);  // frameCounter=1, 1%1=0 → true
      expect(skipper.shouldProcess(0.15, 0.05)).toBe(true);  // frameCounter=2, 2%1=0 → true

      // Switch to low velocity (interval 3)
      // frameCounter is now 2, interval changes to 3
      expect(skipper.shouldProcess(0.02, 0.01)).toBe(true);  // frameCounter=3, 3%3=0 → true
      expect(skipper.shouldProcess(0.02, 0.01)).toBe(false); // frameCounter=4, 4%3=1 → false
      expect(skipper.shouldProcess(0.02, 0.01)).toBe(false); // frameCounter=5, 5%3=2 → false
      expect(skipper.shouldProcess(0.02, 0.01)).toBe(true);  // frameCounter=6, 6%3=0 → true
    });
  });

  describe('Statistics Tracking', () => {
    it('should track total frames correctly', () => {
      for (let i = 0; i < 10; i++) {
        skipper.shouldProcess(0.07, 0.03);
      }

      const stats = skipper.getStats();
      expect(stats.totalFrames).toBe(10);
    });

    it('should track processed frames correctly', () => {
      // Interval 2: every 2nd frame
      for (let i = 0; i < 10; i++) {
        skipper.shouldProcess(0.07, 0.03);
      }

      const stats = skipper.getStats();
      expect(stats.processedFrames).toBe(5); // 10 frames / 2
    });

    it('should track skipped frames correctly', () => {
      // Interval 3: every 3rd frame
      for (let i = 0; i < 9; i++) {
        skipper.shouldProcess(0.02, 0.01);
      }

      const stats = skipper.getStats();
      expect(stats.skippedFrames).toBe(6); // 9 - 3 = 6 skipped
    });

    it('should calculate processing rate correctly', () => {
      // Interval 2: 50% processing rate
      for (let i = 0; i < 10; i++) {
        skipper.shouldProcess(0.07, 0.03);
      }

      expect(skipper.getProcessingRate()).toBeCloseTo(0.5, 1);
    });

    it('should calculate skip rate correctly', () => {
      // Interval 3: ~66.7% skip rate
      for (let i = 0; i < 9; i++) {
        skipper.shouldProcess(0.02, 0.01);
      }

      expect(skipper.getSkipRate()).toBeCloseTo(0.667, 2);
    });

    it('should calculate estimated CPU savings correctly', () => {
      // CPU savings should equal skip rate
      for (let i = 0; i < 9; i++) {
        skipper.shouldProcess(0.02, 0.01);
      }

      const skipRate = skipper.getSkipRate();
      const cpuSavings = skipper.getEstimatedCPUSavings();
      expect(cpuSavings).toBe(skipRate);
    });

    it('should track average interval with EMA', () => {
      // Start with interval 3 (low velocity)
      for (let i = 0; i < 5; i++) {
        skipper.shouldProcess(0.02, 0.01);
      }

      // Switch to interval 1 (high velocity)
      for (let i = 0; i < 5; i++) {
        skipper.shouldProcess(0.15, 0.05);
      }

      const stats = skipper.getStats();
      // Average should be between 1 and 3 due to EMA
      expect(stats.avgInterval).toBeGreaterThan(1);
      expect(stats.avgInterval).toBeLessThan(3);
    });
  });

  describe('Configuration Management', () => {
    it('should update config dynamically', () => {
      skipper.updateConfig({
        maxInterval: 5,
        highVelocityThreshold: 0.2
      });

      // With new threshold (0.2), velocity 0.15 should now be medium (interval 2)
      skipper.shouldProcess(0.15, 0.05);
      expect(skipper.getCurrentInterval()).toBe(2);

      // Low velocity should use new maxInterval (5)
      skipper.shouldProcess(0.02, 0.01);
      expect(skipper.getCurrentInterval()).toBe(5);
    });

    it('should disable adaptive mode when configured', () => {
      skipper.updateConfig({ enableAdaptive: false });

      // Even with low velocity, should process every frame
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(skipper.shouldProcess(0.01, 0.01));
      }

      expect(results.every(r => r === true)).toBe(true);
    });

    it('should preserve other config values when updating', () => {
      const customSkipper = new AdaptiveFrameSkipper({
        baseInterval: 2,
        maxInterval: 4
      });

      customSkipper.updateConfig({ highVelocityThreshold: 0.2 });

      // baseInterval and maxInterval should be preserved
      expect(customSkipper.getCurrentInterval()).toBe(2);
    });
  });

  describe('Stats Reset', () => {
    it('should reset all statistics to zero', () => {
      // Generate some stats
      for (let i = 0; i < 10; i++) {
        skipper.shouldProcess(0.07, 0.03);
      }

      skipper.resetStats();

      const stats = skipper.getStats();
      expect(stats.totalFrames).toBe(0);
      expect(stats.processedFrames).toBe(0);
      expect(stats.skippedFrames).toBe(0);
      expect(stats.avgInterval).toBe(1);
    });

    it('should preserve current interval after reset', () => {
      // Set to low velocity (interval 3)
      skipper.shouldProcess(0.02, 0.01);
      const intervalBefore = skipper.getCurrentInterval();

      skipper.resetStats();

      const intervalAfter = skipper.getCurrentInterval();
      expect(intervalAfter).toBe(intervalBefore);
    });
  });

  describe('Force Next Frame', () => {
    it('should force processing of next frame', () => {
      // Set to interval 3 (low velocity)
      skipper.shouldProcess(0.02, 0.01);
      expect(skipper.getCurrentInterval()).toBe(3);

      // Force next frame
      skipper.forceNextFrame();

      // Next call should return true (forced)
      expect(skipper.shouldProcess(0.02, 0.01)).toBe(true);
    });

    it('should work with any interval setting', () => {
      // Interval 2
      skipper.shouldProcess(0.07, 0.03);

      skipper.forceNextFrame();
      expect(skipper.shouldProcess(0.07, 0.03)).toBe(true);

      // Interval 1 (always processes anyway)
      skipper.shouldProcess(0.15, 0.05);

      skipper.forceNextFrame();
      expect(skipper.shouldProcess(0.15, 0.05)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero velocity', () => {
      skipper.shouldProcess(0, 0);
      // Zero velocity = low velocity → interval 3
      expect(skipper.getCurrentInterval()).toBe(3);
    });

    it('should handle negative velocity (edge case)', () => {
      // This shouldn't happen in practice, but test robustness
      skipper.shouldProcess(-0.1, 0.05);
      // Math.max(-0.1, 0.05) = 0.05
      // But 0.05 is exactly the threshold, not > 0.05
      // So it's low velocity → interval 3
      expect(skipper.getCurrentInterval()).toBe(3);
    });

    it('should handle very high velocity', () => {
      skipper.shouldProcess(1.0, 0.5);
      // Any high value > threshold → interval 1
      expect(skipper.getCurrentInterval()).toBe(1);
    });

    it('should return 1.0 processing rate when no frames processed', () => {
      // Before any frames
      expect(skipper.getProcessingRate()).toBe(1);
    });

    it('should return 0.0 skip rate when no frames processed', () => {
      // Before any frames
      expect(skipper.getSkipRate()).toBe(0);
    });

    it('should handle rapid velocity oscillation', () => {
      // Alternate between high and low velocity
      for (let i = 0; i < 10; i++) {
        const velocity = i % 2 === 0 ? 0.15 : 0.02;
        skipper.shouldProcess(velocity, 0.01);
      }

      const stats = skipper.getStats();
      expect(stats.totalFrames).toBe(10);
      // Should have mix of processed and skipped frames
      expect(stats.processedFrames).toBeGreaterThan(0);
      expect(stats.skippedFrames).toBeGreaterThan(0);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle high-frequency calls efficiently', () => {
      const startTime = performance.now();

      // Simulate 1000 frames
      for (let i = 0; i < 1000; i++) {
        const velocity = Math.random() * 0.2;
        skipper.shouldProcess(velocity, velocity * 0.5);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 50ms
      expect(duration).toBeLessThan(50);
    });

    it('should maintain consistent performance under load', () => {
      // Process many frames
      for (let i = 0; i < 10000; i++) {
        skipper.shouldProcess(0.07, 0.03);
      }

      // Stats should still be accurate
      const stats = skipper.getStats();
      expect(stats.totalFrames).toBe(10000);
      expect(stats.processedFrames + stats.skippedFrames).toBe(10000);
    });

    it('should demonstrate CPU savings with frame skipping', () => {
      // Simulate stationary gaze (interval 3)
      for (let i = 0; i < 30; i++) {
        skipper.shouldProcess(0.01, 0.01);
      }

      const stats = skipper.getStats();
      // With interval 3, should process ~33% of frames
      const processedRatio = stats.processedFrames / stats.totalFrames;
      expect(processedRatio).toBeCloseTo(0.33, 1);

      // CPU savings should be ~67%
      expect(skipper.getEstimatedCPUSavings()).toBeCloseTo(0.67, 1);
    });
  });
});

describe('calculateVelocity', () => {
  it('should calculate velocity correctly for horizontal movement', () => {
    // Move 100 pixels in 100ms = 1000 px/s
    const velocity = calculateVelocity(0, 0, 100, 0, 100);
    expect(velocity).toBe(1000);
  });

  it('should calculate velocity correctly for vertical movement', () => {
    // Move 50 pixels in 50ms = 1000 px/s
    const velocity = calculateVelocity(0, 0, 0, 50, 50);
    expect(velocity).toBe(1000);
  });

  it('should calculate velocity correctly for diagonal movement', () => {
    // Move 30px horizontally and 40px vertically in 100ms
    // Distance = sqrt(30^2 + 40^2) = 50
    // Velocity = 50 / 0.1 = 500 px/s
    const velocity = calculateVelocity(0, 0, 30, 40, 100);
    expect(velocity).toBe(500);
  });

  it('should return 0 for zero deltaTime', () => {
    const velocity = calculateVelocity(0, 0, 100, 100, 0);
    expect(velocity).toBe(0);
  });

  it('should return 0 for zero movement', () => {
    const velocity = calculateVelocity(50, 50, 50, 50, 100);
    expect(velocity).toBe(0);
  });

  it('should handle negative coordinates', () => {
    // Move from (-10, -10) to (10, 10) in 100ms
    // Distance = sqrt(400 + 400) = ~28.28
    // Velocity = 28.28 / 0.1 = 282.8 px/s
    const velocity = calculateVelocity(-10, -10, 10, 10, 100);
    expect(velocity).toBeCloseTo(282.84, 1);
  });

  it('should normalize velocity to per-second basis', () => {
    // Same distance, different time
    const velocity1 = calculateVelocity(0, 0, 100, 0, 100);  // 100ms
    const velocity2 = calculateVelocity(0, 0, 100, 0, 1000); // 1000ms

    // velocity1 should be 10x velocity2
    expect(velocity1).toBe(velocity2 * 10);
  });
});
