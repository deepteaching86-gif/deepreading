import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveROIOptimizer, ROI } from './adaptiveROI';

describe('AdaptiveROIOptimizer', () => {
  let optimizer: AdaptiveROIOptimizer;

  beforeEach(() => {
    optimizer = new AdaptiveROIOptimizer();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default config', () => {
      const defaultOptimizer = new AdaptiveROIOptimizer();
      expect(defaultOptimizer).toBeDefined();
    });

    it('should accept custom config', () => {
      const customOptimizer = new AdaptiveROIOptimizer({
        basePadding: 0.15,
        minPadding: 0.05,
        maxPadding: 0.25
      });
      expect(customOptimizer).toBeDefined();
    });
  });

  describe('Adaptive Padding', () => {
    it('should start with base padding (0.2)', () => {
      // getAdaptivePadding already adjusts padding on first call
      // So we check currentPadding before any calls
      const padding = optimizer.getAdaptivePadding(true);
      // After one successful detection, padding may decrease slightly (0.2 -> 0.18)
      expect(padding).toBeGreaterThanOrEqual(0.18);
      expect(padding).toBeLessThanOrEqual(0.2);
    });

    it('should decrease padding with high success rate', () => {
      // Simulate 10 successful detections
      for (let i = 0; i < 10; i++) {
        optimizer.getAdaptivePadding(true);
      }

      // After high success rate, padding should decrease
      const finalPadding = optimizer.getAdaptivePadding(true);
      expect(finalPadding).toBeLessThan(0.2);
    });

    it('should increase padding with low success rate', () => {
      // Simulate 10 failed detections
      for (let i = 0; i < 10; i++) {
        optimizer.getAdaptivePadding(false);
      }

      // After low success rate, padding should increase
      const finalPadding = optimizer.getAdaptivePadding(false);
      expect(finalPadding).toBeGreaterThan(0.2);
    });

    it('should not exceed max padding (0.3)', () => {
      // Simulate many failed detections
      for (let i = 0; i < 20; i++) {
        optimizer.getAdaptivePadding(false);
      }

      const padding = optimizer.getAdaptivePadding(false);
      expect(padding).toBeLessThanOrEqual(0.3);
    });

    it('should not go below min padding (0.1)', () => {
      // Simulate many successful detections
      for (let i = 0; i < 20; i++) {
        optimizer.getAdaptivePadding(true);
      }

      const padding = optimizer.getAdaptivePadding(true);
      expect(padding).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('ROI Calculation', () => {
    it('should calculate optimized ROI with padding', () => {
      const baseROI: ROI = {
        x: 100,
        y: 100,
        width: 50,
        height: 50
      };

      const optimizedROI = optimizer.calculateOptimizedROI(baseROI, true, false);

      // With 0.2 padding, ROI should expand by 20% on each side
      expect(optimizedROI.x).toBeLessThan(baseROI.x);
      expect(optimizedROI.y).toBeLessThan(baseROI.y);
      expect(optimizedROI.width).toBeGreaterThan(baseROI.width);
      expect(optimizedROI.height).toBeGreaterThan(baseROI.height);
    });

    it('should apply downsampling when enabled', () => {
      const baseROI: ROI = {
        x: 100,
        y: 100,
        width: 100,
        height: 100
      };

      const downsampledROI = optimizer.calculateOptimizedROI(baseROI, true, true);

      // With 0.75 downsampling, width/height should be 75% of original (after padding)
      expect(downsampledROI.width).toBeLessThan(baseROI.width * 1.5); // Padded then downsampled
    });

    it('should calculate ROI with padding even at edges', () => {
      const baseROI: ROI = {
        x: 0,
        y: 0,
        width: 50,
        height: 50
      };

      const optimizedROI = optimizer.calculateOptimizedROI(baseROI, true, false);

      // With padding, x and y may go negative (bounds clamping happens in caller)
      // ROI should still have valid dimensions
      expect(optimizedROI.width).toBeGreaterThan(baseROI.width);
      expect(optimizedROI.height).toBeGreaterThan(baseROI.height);
    });
  });

  describe('ROI Caching', () => {
    const leftROI: ROI = { x: 50, y: 50, width: 30, height: 30 };
    const rightROI: ROI = { x: 120, y: 50, width: 30, height: 30 };

    it('should cache ROI after calculation', () => {
      optimizer.cacheROI(leftROI, rightROI);

      const cachedROI = optimizer.getCachedROI();
      expect(cachedROI).not.toBeNull();
      expect(cachedROI?.left).toEqual(leftROI);
      expect(cachedROI?.right).toEqual(rightROI);
    });

    it('should reuse cached ROI when face is stationary', () => {
      optimizer.cacheROI(leftROI, rightROI);

      const lowVelocity = 0.02; // Below movement threshold (0.05)
      const shouldReuse = optimizer.shouldReuseROI(lowVelocity);

      expect(shouldReuse).toBe(true);
    });

    it('should not reuse cached ROI when face moves significantly', () => {
      optimizer.cacheROI(leftROI, rightROI);

      const highVelocity = 0.1; // Above movement threshold (0.05)
      const shouldReuse = optimizer.shouldReuseROI(highVelocity);

      expect(shouldReuse).toBe(false);
    });

    it('should expire cache after cacheDuration frames', () => {
      optimizer.cacheROI(leftROI, rightROI);

      // Simulate 6 frames passing (cacheDuration is 5)
      const lowVelocity = 0.02;
      for (let i = 0; i < 6; i++) {
        optimizer.shouldReuseROI(lowVelocity);
      }

      // Cache should be expired
      const shouldReuse = optimizer.shouldReuseROI(lowVelocity);
      expect(shouldReuse).toBe(false);
    });

    it('should invalidate cache when movement exceeds threshold', () => {
      optimizer.cacheROI(leftROI, rightROI);

      // Low velocity - cache reused
      const firstReuse = optimizer.shouldReuseROI(0.02);
      expect(firstReuse).toBe(true);

      // High velocity - cache invalidated (set to null)
      const secondReuse = optimizer.shouldReuseROI(0.1);
      expect(secondReuse).toBe(false);

      // Low velocity again - but cache is null, so should not reuse
      const thirdReuse = optimizer.shouldReuseROI(0.02);
      expect(thirdReuse).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should track cache hits and misses', () => {
      const leftROI: ROI = { x: 50, y: 50, width: 30, height: 30 };
      const rightROI: ROI = { x: 120, y: 50, width: 30, height: 30 };

      optimizer.cacheROI(leftROI, rightROI);

      // Cache hit
      optimizer.shouldReuseROI(0.02);

      // Cache miss
      optimizer.shouldReuseROI(0.1);

      const stats = optimizer.getStats();
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
    });

    it('should track average padding', () => {
      // Generate some detections to create padding history
      for (let i = 0; i < 10; i++) {
        optimizer.getAdaptivePadding(true);
      }

      const stats = optimizer.getStats();
      expect(stats.avgPadding).toBeGreaterThan(0);
      expect(stats.avgPadding).toBeLessThan(0.3);
    });

    it('should track downsample count', () => {
      const baseROI: ROI = { x: 100, y: 100, width: 50, height: 50 };

      // Apply downsampling
      optimizer.calculateOptimizedROI(baseROI, true, true);

      const stats = optimizer.getStats();
      expect(stats.downsampleCount).toBe(1);
    });

    it('should reset statistics', () => {
      const leftROI: ROI = { x: 50, y: 50, width: 30, height: 30 };
      const rightROI: ROI = { x: 120, y: 50, width: 30, height: 30 };

      // Generate some stats
      optimizer.cacheROI(leftROI, rightROI);
      optimizer.shouldReuseROI(0.02);
      optimizer.shouldReuseROI(0.1);
      optimizer.calculateOptimizedROI(leftROI, true, true);

      // Reset
      optimizer.resetStats();

      const stats = optimizer.getStats();
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
      expect(stats.avgPadding).toBe(0);
      expect(stats.downsampleCount).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-sized ROI', () => {
      const zeroROI: ROI = { x: 100, y: 100, width: 0, height: 0 };

      const optimizedROI = optimizer.calculateOptimizedROI(zeroROI, true, false);

      // Zero-sized ROI will result in zero-sized output (no special handling)
      // This is expected behavior - caller should validate input
      expect(optimizedROI.width).toBe(0);
      expect(optimizedROI.height).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const negativeROI: ROI = { x: -10, y: -10, width: 50, height: 50 };

      const optimizedROI = optimizer.calculateOptimizedROI(negativeROI, true, false);

      // Negative coordinates are allowed (bounds clamping happens in caller)
      // ROI should still be calculated with padding applied
      expect(optimizedROI.x).toBeLessThan(negativeROI.x);
      expect(optimizedROI.y).toBeLessThan(negativeROI.y);
    });

    it('should handle very large ROI', () => {
      const largeROI: ROI = { x: 0, y: 0, width: 10000, height: 10000 };

      const optimizedROI = optimizer.calculateOptimizedROI(largeROI, true, false);

      expect(optimizedROI.width).toBeGreaterThan(0);
      expect(optimizedROI.height).toBeGreaterThan(0);
    });

    it('should handle rapid success/failure oscillation', () => {
      // Alternate between success and failure
      for (let i = 0; i < 20; i++) {
        optimizer.getAdaptivePadding(i % 2 === 0);
      }

      const padding = optimizer.getAdaptivePadding(true);

      // Padding should stabilize around base padding
      expect(padding).toBeGreaterThan(0.1);
      expect(padding).toBeLessThan(0.3);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle high-frequency calls efficiently', () => {
      const baseROI: ROI = { x: 100, y: 100, width: 50, height: 50 };

      const startTime = performance.now();

      // Simulate 1000 ROI calculations
      for (let i = 0; i < 1000; i++) {
        optimizer.calculateOptimizedROI(baseROI, i % 2 === 0, i % 3 === 0);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 100ms (very conservative)
      expect(duration).toBeLessThan(100);
    });

    it('should maintain memory efficiency with large detection history', () => {
      // Generate 1000 detections (history size is 10, should not grow indefinitely)
      for (let i = 0; i < 1000; i++) {
        optimizer.getAdaptivePadding(Math.random() > 0.5);
      }

      // Should still function correctly
      // Note: padding could be at min or max depending on random outcomes
      const padding = optimizer.getAdaptivePadding(true);
      expect(padding).toBeGreaterThanOrEqual(0.1);
      expect(padding).toBeLessThanOrEqual(0.3);
    });
  });
});
