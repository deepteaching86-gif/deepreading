# Face Detection Issue - Technical Assessment

## Problem Summary
MediaPipe Face Mesh with `@tensorflow-models/face-landmarks-detection` v1.0.6 using tfjs runtime **cannot detect faces** in the browser despite:
- ✅ Video feed working perfectly (640x480, readyState: 4)
- ✅ Good lighting conditions (brightness: 154-170/255)
- ✅ Face clearly visible on canvas
- ✅ TensorFlow.js backend loaded correctly
- ✅ Detector initialized successfully

## Root Cause
The tfjs runtime in `@tensorflow-models/face-landmarks-detection` v1.0.6 has known limitations and **returns empty arrays** `Array(0)` consistently, even with perfect video input.

## Evidence from Debugging
```javascript
🔍 Pre-detection state: {detectorExists: true, videoElement: {width: 640, height: 480, readyState: 4}}
🔍 Detection result: {facesArray: Array(0), facesLength: 0, facesType: 'object', firstFace: 'no face'}
```

The model loads successfully but **cannot detect any faces** regardless of:
- Static vs dynamic mode
- Lighting conditions
- Face position
- Camera quality

## Recommended Solutions

### Option 1: Upgrade to MediaPipe Tasks Vision (Recommended)
Install the newer official MediaPipe package:
```bash
npm install @mediapipe/tasks-vision
```

Benefits:
- Official MediaPipe implementation
- Better browser compatibility
- More reliable face detection
- Active development and support

### Option 2: Alternative Face Detection Libraries
- `face-api.js` - TensorFlow.js-based with better browser support
- `@vladmandic/face-api` - Modern fork with improved performance
- BlazeFace model from TensorFlow.js (lighter weight)

### Option 3: Fallback Strategy
Implement multiple detection libraries with automatic fallback:
1. Try MediaPipe Tasks Vision
2. Fall back to face-api.js
3. Fall back to BlazeFace

## Current Status
- ✅ Package `@mediapipe/tasks-vision` installed (v0.10.22-rc.20250304)
- ✅ **NEW IMPLEMENTATION COMPLETE**: `frontend/src/hooks/useGazeTracking.v2.ts`
- ✅ Refactoring plan documented: `MEDIAPIPE_TASKS_VISION_REFACTOR.md`
- ⏳ Testing with real camera/users required
- ⏳ Production deployment pending

## Implementation Completed (2025-10-17)

**New File**: [`frontend/src/hooks/useGazeTracking.v2.ts`](frontend/src/hooks/useGazeTracking.v2.ts)

### Key Changes:
1. **Removed TensorFlow.js dependency** - No longer needed
2. **MediaPipe Tasks Vision API** - Using official `FaceLandmarker` from `@mediapipe/tasks-vision`
3. **Better detection** - Uses `detectForVideo()` optimized for video streams
4. **WASM runtime** - Automatic backend selection, no manual configuration
5. **Same landmark indices** - Compatible with existing gaze estimation logic
6. **Normalized coordinates** - MediaPipe returns 0-1 normalized coords (converted to pixels internally)

### API Differences:
- **Initialization**: `FilesetResolver.forVisionTasks()` → `FaceLandmarker.createFromModelPath()`
- **Detection**: `detectForVideo(video, timestamp)` instead of `estimateFaces(video, options)`
- **Result**: `result.faceLandmarks[0]` instead of `faces[0].keypoints`
- **Coordinates**: Normalized (0-1) instead of pixel coordinates
- **Configuration**: `setOptions({ numFaces, minDetectionConfidence, minTrackingConfidence })`

## Next Steps
1. **Test new implementation**:
   - Rename `useGazeTracking.v2.ts` → `useGazeTracking.ts` (backup old version first)
   - Test face detection with real camera
   - Verify landmark accuracy and gaze estimation
   - Check iOS/iPad compatibility
2. **Deploy to production** if tests pass
3. **Remove TensorFlow.js dependencies** from package.json:
   - `@tensorflow-models/face-landmarks-detection`
   - `@tensorflow/tfjs`
4. **Monitor for issues** and collect user feedback

## References
- [MediaPipe Tasks Vision Documentation](https://developers.google.com/mediapipe/solutions/vision/face_landmarker/web_js)
- [TensorFlow.js Face Landmarks Detection](https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection)
- [Known Issues with tfjs runtime](https://github.com/tensorflow/tfjs-models/issues)
