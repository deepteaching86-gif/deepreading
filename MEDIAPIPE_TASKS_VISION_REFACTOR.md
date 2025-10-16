# MediaPipe Tasks Vision Refactoring Plan

## Context7 Research Summary

Based on official MediaPipe documentation from `/google-ai-edge/mediapipe`, the proper implementation for browser-based face landmark detection uses:

### Package
```bash
@mediapipe/tasks-vision
```

### Initialization Pattern
```javascript
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
);

const faceLandmarker = await FaceLandmarker.createFromModelPath(
  vision,
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
);
```

### Detection Pattern
```javascript
// For static images
const landmarks = faceLandmarker.detect(image);

// For video streams (recommended for our use case)
const landmarks = faceLandmarker.detectForVideo(video, timestamp);
```

### Configuration Options
```javascript
faceLandmarker.setOptions({
  numFaces: 1,                    // Maximum number of faces to detect
  minDetectionConfidence: 0.5,    // Minimum confidence for detection
  minTrackingConfidence: 0.5,     // Minimum confidence for tracking
  outputFaceBlendshapes: false,   // Face expression data (optional)
  outputFacialTransformationMatrixes: false  // 3D pose matrix (optional)
});
```

## Key Differences from Current Implementation

### 1. **Import Structure**
**OLD** (`@tensorflow-models/face-landmarks-detection`):
```typescript
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';
```

**NEW** (`@mediapipe/tasks-vision`):
```typescript
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
// TensorFlow.js NO LONGER NEEDED
```

### 2. **Initialization**
**OLD**:
```typescript
await tf.ready();
const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
const detector = await faceLandmarksDetection.createDetector(model, {
  runtime: 'tfjs',
  refineLandmarks: true,
  maxFaces: 1
});
```

**NEW**:
```typescript
const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
);
const faceLandmarker = await FaceLandmarker.createFromModelPath(
  vision,
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
);
faceLandmarker.setOptions({
  numFaces: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
```

### 3. **Detection API**
**OLD**:
```typescript
const faces = await detector.estimateFaces(video, {
  flipHorizontal: false,
  staticImageMode: false
});
// Returns: Array of Face objects with keypoints
```

**NEW**:
```typescript
const result = faceLandmarker.detectForVideo(video, performance.now());
// Returns: FaceLandmarkerResult with faceLandmarks array
```

### 4. **Result Structure**
**OLD**:
```typescript
interface Face {
  keypoints: Array<{ x: number; y: number; z?: number; name?: string }>;
  box: { xMin: number; yMin: number; width: number; height: number };
}
```

**NEW**:
```typescript
interface FaceLandmarkerResult {
  faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
  faceBlendshapes?: Array<any>;  // Optional
  facialTransformationMatrixes?: Array<any>;  // Optional
}
```

### 5. **Landmark Indices**
**SAME**: MediaPipe Face Mesh uses the same 478 landmark indices
- Face mesh: 0-467 (468 points)
- Iris landmarks: 468-477 (10 points total, 5 per eye)

**KEY LANDMARKS** (unchanged):
- Left eye outer: 33
- Left eye inner: 133
- Right eye outer: 263
- Right eye inner: 362
- Left iris center: 468
- Right iris center: 473
- Nose tip: 1

## Refactoring Steps

### Step 1: Update Imports
Replace TensorFlow.js + face-landmarks-detection imports with MediaPipe Tasks Vision

### Step 2: Remove TensorFlow.js Initialization
Remove `tf.ready()`, `tf.setBackend()`, and all TensorFlow.js backend logic

### Step 3: Refactor Initialization Function
- Replace detector creation with `FilesetResolver` + `FaceLandmarker.createFromModelPath()`
- Update configuration options
- Remove iOS backend detection logic (WASM handles this automatically)

### Step 4: Update Detection Loop
- Replace `estimateFaces()` with `detectForVideo(video, timestamp)`
- Update result structure handling from `faces[0].keypoints` to `result.faceLandmarks[0]`
- Update landmark access patterns

### Step 5: Update Type Definitions
- Remove `faceLandmarksDetection.FaceLandmarksDetector` type
- Add `FaceLandmarker` type from `@mediapipe/tasks-vision`
- Update refs and state types

### Step 6: Test and Validate
- Test face detection with real camera
- Verify landmark accuracy
- Check performance (should be better with native WASM)
- Validate iOS/iPad compatibility

## Expected Benefits

1. **Working Face Detection**: Official MediaPipe implementation, not broken tfjs runtime
2. **Better Performance**: Native WASM is faster than TensorFlow.js
3. **Active Support**: Official Google package with ongoing updates
4. **Browser Compatibility**: Better cross-browser support, especially iOS/Safari
5. **Simpler Code**: No TensorFlow.js backend management needed
6. **Smaller Bundle**: Removes TensorFlow.js dependency (~5MB reduction)

## Migration Risks

- **Breaking Changes**: API is completely different, requires careful testing
- **Landmark Structure**: Result structure differs (array of arrays vs array of objects)
- **Configuration**: Different options available (no staticImageMode)
- **Error Handling**: Different error types and failure modes

## Next Steps

1. Create new hook implementation file: `useGazeTracking.v2.ts`
2. Implement new API with proper error handling
3. Test with real camera and users
4. Run side-by-side comparison if possible
5. Deploy and monitor for issues
6. Remove old TensorFlow.js dependencies once validated

## References

- [MediaPipe Tasks Vision Web](https://developers.google.com/mediapipe/solutions/vision/face_landmarker/web_js)
- [MediaPipe Face Mesh](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/face_mesh.md)
- [Context7 Research Results](From `/google-ai-edge/mediapipe`)
