// Heatmap Generation Service

import { HeatmapData, GazePoint } from '../../types/vision.types';

export async function generateHeatmapData(gazeDataChunks: any[]): Promise<HeatmapData[]> {
  const heatmaps: HeatmapData[] = [];

  // Group gaze data by passage
  const passageGroups = new Map<string, GazePoint[]>();

  gazeDataChunks.forEach(chunk => {
    const passageId = chunk.passageId;
    const points = chunk.gazePoints as GazePoint[];

    if (!passageGroups.has(passageId)) {
      passageGroups.set(passageId, []);
    }
    passageGroups.get(passageId)!.push(...points);
  });

  // Generate heatmap for each passage
  for (const [passageId, gazePoints] of passageGroups.entries()) {
    const heatmap = generateHeatmapForPassage(passageId, gazePoints);
    heatmaps.push(heatmap);
  }

  return heatmaps;
}

function generateHeatmapForPassage(passageId: string, gazePoints: GazePoint[]): HeatmapData {
  const resolution = { width: 32, height: 18 }; // Grid resolution
  const cellWidth = 1 / resolution.width;
  const cellHeight = 1 / resolution.height;

  // Initialize grid
  const grid: Map<string, { intensity: number; count: number; totalDuration: number }> = new Map();

  // Populate grid with gaze points
  gazePoints.forEach((point, index) => {
    if (point.type === 'blink') return;

    const cellX = Math.floor(point.x / cellWidth);
    const cellY = Math.floor(point.y / cellHeight);
    const key = `${cellX},${cellY}`;

    if (!grid.has(key)) {
      grid.set(key, { intensity: 0, count: 0, totalDuration: 0 });
    }

    const cell = grid.get(key)!;
    cell.count++;

    // Estimate fixation duration (time to next point)
    if (index < gazePoints.length - 1) {
      const duration = gazePoints[index + 1].timestamp - point.timestamp;
      cell.totalDuration += duration;
    }
  });

  // Normalize intensities
  let maxIntensity = 0;
  grid.forEach(cell => {
    if (cell.totalDuration > maxIntensity) {
      maxIntensity = cell.totalDuration;
    }
  });

  const cells = Array.from(grid.entries()).map(([key, cell]) => {
    const [x, y] = key.split(',').map(Number);
    return {
      x,
      y,
      intensity: maxIntensity > 0 ? cell.totalDuration / maxIntensity : 0,
      fixationCount: cell.count,
      averageFixationDuration: cell.count > 0 ? cell.totalDuration / cell.count : 0
    };
  });

  return {
    passageId,
    resolution,
    cells
  };
}
