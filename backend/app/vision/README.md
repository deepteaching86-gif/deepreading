# Vision Tracking Module

Real-time eye tracking system using OpenCV, MediaPipe, and JEO EyeTracker algorithms.

## 🎯 Purpose

Solves WebGazer.js limitations:
- ✅ Accurate **vertical (up/down) eye movement** detection
- ✅ **Center gaze** detection
- ✅ **3D head pose estimation** for improved accuracy
- ✅ **Glasses reflection handling** (glare removal)

## 🔧 Technology Stack

- **OpenCV**: Pupil detection, image processing, glare removal
- **MediaPipe Face Mesh**: 3D head pose estimation (468 facial landmarks)
- **JEO EyeTracker Algorithms**: OrloskyPupilDetector for accurate pupil detection
- **WebSocket**: Real-time video frame streaming
- **FastAPI**: API endpoints and WebSocket handling

## 📋 Requirements

### Python Version
**CRITICAL**: MediaPipe requires **Python 3.12 or earlier**
- ❌ Python 3.13+ is NOT supported
- ✅ Python 3.12.x (recommended)
- ✅ Python 3.11.x (compatible)

### Local Development
If using Python 3.13 locally, you have two options:
1. Install Python 3.12 for this project
2. Skip local testing - deploy directly to Render.com (uses Python 3.12)

### Dependencies
```bash
opencv-python>=4.10.0
mediapipe>=0.10.0
websockets>=14.0
pillow>=11.0.0
```

## 🚀 Deployment

### Render.com Configuration
The `runtime.txt` file specifies Python 3.12 for Render.com:
```
python-3.12.8
```

This ensures MediaPipe installs correctly in production.

### Installation
```bash
cd backend
pip install -r requirements.txt
```

## 📡 API Endpoints

### 1. Start Vision Session
```http
POST /api/vision/sessions
Content-Type: application/json

{
  "student_id": "student123",
  "template_id": "test_template",
  "device_info": {
    "userAgent": "...",
    "screenWidth": 1920,
    "screenHeight": 1080
  }
}
```

**Response:**
```json
{
  "id": "vision_session_12345",
  "student_id": "student123",
  "template_id": "test_template",
  "status": "active",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### 2. WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/api/vision/ws/session_12345');

// Send video frames
ws.send(JSON.stringify({
  image: 'data:image/jpeg;base64,...',
  timestamp: Date.now(),
  screenWidth: 1920,
  screenHeight: 1080
}));

// Receive gaze data
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Gaze position:', data.x, data.y);
};
```

### 3. Save Calibration
```http
POST /api/vision/sessions/{session_id}/calibration
Content-Type: application/json

{
  "points": [
    {
      "screen_x": 960,
      "screen_y": 540,
      "gaze_x": 955,
      "gaze_y": 538,
      "timestamp": 1234567890
    }
  ],
  "screen_width": 1920,
  "screen_height": 1080,
  "accuracy": 0.95
}
```

### 4. Test Endpoint
```http
GET /api/vision/test
```

**Response:**
```json
{
  "status": "ok",
  "message": "Vision tracking module is running",
  "features": [
    "JEO pupil detection",
    "MediaPipe head pose estimation",
    "3D gaze vector calculation",
    "WebSocket real-time tracking"
  ]
}
```

## 🏗️ Architecture

```
┌─────────────────┐
│   Client        │
│  (React App)    │
└────────┬────────┘
         │ WebSocket
         ↓
┌─────────────────┐
│  Vision Router  │
│   (FastAPI)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌─────────┐ ┌──────────────┐
│ Pupil   │ │  Head Pose   │
│Detector │ │  Estimator   │
│ (JEO)   │ │ (MediaPipe)  │
└─────────┘ └──────────────┘
    │         │
    └────┬────┘
         ↓
┌─────────────────┐
│ Vision Tracker  │
│  (Integration)  │
└─────────────────┘
```

## 🧪 Testing

### Local Testing (Python 3.12)
```bash
# Start server
uvicorn app.main:app --reload --port 8000

# Test endpoint
curl http://localhost:8000/api/vision/test
```

### Production Testing (Render.com)
```bash
curl https://literacy-english-test-backend.onrender.com/api/vision/test
```

## 📊 Performance Optimization

- **Batch Database Writes**: Buffers 100 gaze points before DB insertion
- **Real-time WebSocket**: Sub-100ms latency for gaze data streaming
- **Glare Removal**: OpenCV inpainting for glasses reflection handling
- **3D Pose Estimation**: PnP algorithm for accurate head orientation

## 🔍 Algorithm Details

### OrloskyPupilDetector (JEO)
1. Convert to grayscale
2. Remove glare using adaptive thresholding + inpainting
3. Apply Gaussian blur
4. Detect pupil contours
5. Filter by size and circularity
6. Calculate pupil center

### HeadPoseEstimator (MediaPipe)
1. Detect 468 facial landmarks
2. Extract 6 key points (nose, chin, eyes, mouth corners)
3. Solve PnP problem for 3D rotation/translation
4. Calculate pitch, yaw, roll angles
5. Compute 3D gaze vector

### VisionTracker (Integration)
1. Process frame through both detectors
2. Combine pupil position + head pose
3. Calculate 3D gaze vector
4. Project to 2D screen coordinates (ray-plane intersection)
5. Apply calibration offsets
6. Return gaze point (x, y)

## 🐛 Troubleshooting

### MediaPipe Installation Fails
```
ERROR: Could not find a version that satisfies the requirement mediapipe
```
**Solution**: Check Python version. Must be ≤3.12

### WebSocket Connection Refused
```
WebSocket connection failed
```
**Solution**: Ensure server is running and CORS is configured

### Inaccurate Gaze Detection
**Solution**: Perform 9-point calibration before testing

## 📝 Next Steps

1. ✅ Backend implementation complete
2. ⏳ Deploy to Render.com with Python 3.12
3. ⏳ Create React frontend with WebSocket client
4. ⏳ Implement calibration UI (9-point grid)
5. ⏳ Admin debug mode with real-time visualization
6. ⏳ Student test mode integration

## 📚 References

- [JEO EyeTracker GitHub](https://github.com/JEOresearch/EyeTracker/tree/main/Webcam3DTracker)
- [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [OpenCV PnP Algorithm](https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html#ga549c2075fac14829ff4a58bc931c033d)
