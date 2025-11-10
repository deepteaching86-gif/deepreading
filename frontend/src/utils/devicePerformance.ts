/**
 * Device Performance Detection Utility
 *
 * Detects device tier (low/medium/high) based on GPU/CPU performance
 * Used for adaptive resolution and debug mode configuration
 */

export type DeviceTier = 'low' | 'medium' | 'high';

export interface DevicePerformanceConfig {
  tier: DeviceTier;
  cameraResolution: {
    width: number;
    height: number;
  };
  enableDebug: boolean;
  jpegQuality: number;
}

/**
 * Benchmark GPU performance using WebGL
 * Returns operations per second (higher = better)
 */
function benchmarkGPU(): Promise<number> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      // No WebGL support - assume low tier
      resolve(0);
      return;
    }

    // Simple GPU benchmark: fill rate test
    const startTime = performance.now();
    let frames = 0;
    const targetFrames = 60;

    const render = () => {
      // @ts-ignore
      gl.clearColor(Math.random(), Math.random(), Math.random(), 1.0);
      // @ts-ignore
      gl.clear(gl.COLOR_BUFFER_BIT);
      frames++;

      if (frames < targetFrames) {
        requestAnimationFrame(render);
      } else {
        const duration = performance.now() - startTime;
        const fps = (frames / duration) * 1000;
        resolve(fps);
      }
    };

    render();
  });
}

/**
 * Detect device memory (if available)
 */
function getDeviceMemory(): number {
  // @ts-ignore
  if (navigator.deviceMemory) {
    // @ts-ignore
    return navigator.deviceMemory; // GB
  }
  return 4; // Default assumption
}

/**
 * Detect hardware concurrency (CPU cores)
 */
function getHardwareConcurrency(): number {
  return navigator.hardwareConcurrency || 4; // Default to 4 cores
}

/**
 * Detect if mobile device
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detect device tier based on performance metrics
 */
export async function detectDeviceTier(): Promise<DeviceTier> {
  const isMobile = isMobileDevice();
  const memory = getDeviceMemory();
  const cores = getHardwareConcurrency();
  const gpuFps = await benchmarkGPU();

  console.log('🔍 Device Performance Metrics:');
  console.log(`   Mobile: ${isMobile}`);
  console.log(`   Memory: ${memory} GB`);
  console.log(`   CPU Cores: ${cores}`);
  console.log(`   GPU FPS: ${gpuFps.toFixed(1)}`);

  // Scoring system
  let score = 0;

  // GPU performance (most important for vision tracking)
  if (gpuFps > 50) score += 3;
  else if (gpuFps > 30) score += 2;
  else if (gpuFps > 15) score += 1;

  // Memory
  if (memory >= 8) score += 2;
  else if (memory >= 4) score += 1;

  // CPU cores
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;

  // Mobile penalty
  if (isMobile) score -= 2;

  // Determine tier
  let tier: DeviceTier;
  if (score >= 6) {
    tier = 'high';
  } else if (score >= 3) {
    tier = 'medium';
  } else {
    tier = 'low';
  }

  console.log(`✅ Device Tier: ${tier.toUpperCase()} (score: ${score})`);

  return tier;
}

/**
 * Get optimal configuration for device tier
 */
export function getDeviceConfig(tier: DeviceTier): DevicePerformanceConfig {
  const configs: Record<DeviceTier, DevicePerformanceConfig> = {
    low: {
      tier: 'low',
      cameraResolution: { width: 640, height: 480 },
      enableDebug: false, // Disable debug images for low-end devices
      jpegQuality: 70,
    },
    medium: {
      tier: 'medium',
      cameraResolution: { width: 960, height: 720 },
      enableDebug: false, // Debug images optional (user can enable)
      jpegQuality: 80,
    },
    high: {
      tier: 'high',
      cameraResolution: { width: 1280, height: 720 },
      enableDebug: true, // Enable debug images for high-end devices
      jpegQuality: 90,
    },
  };

  return configs[tier];
}

/**
 * Auto-detect device performance and return optimal config
 */
export async function detectDevicePerformance(): Promise<DevicePerformanceConfig> {
  const tier = await detectDeviceTier();
  const config = getDeviceConfig(tier);

  console.log('🎯 Device Configuration:');
  console.log(`   Resolution: ${config.cameraResolution.width}x${config.cameraResolution.height}`);
  console.log(`   Debug Mode: ${config.enableDebug ? 'ON' : 'OFF'}`);
  console.log(`   JPEG Quality: ${config.jpegQuality}%`);

  return config;
}
