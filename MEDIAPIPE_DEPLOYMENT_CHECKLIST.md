# MediaPipe Tasks Vision Deployment Checklist

## Pre-Deployment Testing

### ✅ Step 1: Backup Current Implementation
```bash
cd frontend/src/hooks
cp useGazeTracking.ts useGazeTracking.old.ts
```

### ✅ Step 2: Replace with New Implementation
```bash
cd frontend/src/hooks
cp useGazeTracking.v2.ts useGazeTracking.ts
```

### ⏳ Step 3: Local Testing
1. **Start development server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Test face detection**:
   - Open browser to development URL
   - Grant camera permissions
   - Verify face is detected (green "✅ Face: 1" indicator)
   - Check console for "✅ Face detected with 478 landmarks"
   - Verify iris tracking (yellow dots visible on irises)

3. **Test across browsers**:
   - Chrome/Edge (WebGL backend)
   - Firefox (WebGL backend)
   - Safari (WASM backend)

4. **Test on mobile devices**:
   - iOS Safari (iPad/iPhone)
   - Android Chrome
   - Check camera permissions workflow
   - Verify performance (target 30 FPS)

### ⏳ Step 4: Vision TEST Integration
1. Navigate to Vision TEST page
2. Start calibration process
3. Verify calibration fixation detection works
4. Complete reading test
5. Check gaze statistics are accurate

## Build Validation

### ⏳ Step 5: Production Build Test
```bash
cd frontend
npm run build
```

**Expected Output**:
- ✅ No TypeScript errors
- ✅ No build warnings
- ✅ Build succeeds
- ✅ Bundle size reasonable (~2-3MB total, -5MB from removing TensorFlow.js)

### ⏳ Step 6: Preview Production Build
```bash
npm run preview
```

Test same scenarios as Step 3 on production build.

## Deployment

### ⏳ Step 7: Commit Changes
```bash
cd frontend
git add src/hooks/useGazeTracking.ts
git add src/hooks/useGazeTracking.v2.ts
git status  # Review changes
git commit -m "Fix: Migrate to MediaPipe Tasks Vision for reliable face detection

- Replace broken tfjs runtime with official @mediapipe/tasks-vision package
- Use FaceLandmarker.detectForVideo() for video stream detection
- Remove TensorFlow.js dependency (5MB bundle size reduction)
- Better detection reliability and cross-browser compatibility
- Maintained same landmark indices and gaze estimation logic

Resolves face detection failure issue documented in FACE_DETECTION_ISSUE.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### ⏳ Step 8: Push to Repository
```bash
git push origin main
```

**Expected**: Netlify auto-deployment triggered

### ⏳ Step 9: Monitor Deployment
1. Check Netlify dashboard for build status
2. Wait for deployment completion (~2-5 minutes)
3. Check deploy log for errors

### ⏳ Step 10: Production Smoke Test
1. Visit production URL
2. Test face detection on production
3. Complete one Vision TEST
4. Verify gaze data is recorded in database

## Post-Deployment Validation

### ⏳ Step 11: User Testing
- Test with 3-5 real users
- Collect feedback on face detection reliability
- Check for any error reports
- Monitor console logs for issues

### ⏳ Step 12: Performance Monitoring
- Check server logs for errors
- Monitor database for gaze data quality
- Verify FPS remains ~30 FPS
- Check memory usage (should be lower without TensorFlow.js)

## Cleanup (After Validation)

### ⏳ Step 13: Remove Old Dependencies
If new implementation works well after 24-48 hours:

```bash
cd frontend
npm uninstall @tensorflow-models/face-landmarks-detection @tensorflow/tfjs
```

Update `package.json` commit:
```bash
git add package.json package-lock.json
git commit -m "Remove deprecated TensorFlow.js face detection dependencies

Cleanup after successful migration to MediaPipe Tasks Vision.
Reduces bundle size by ~5MB.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
```

### ⏳ Step 14: Remove Backup Files
```bash
cd frontend/src/hooks
rm useGazeTracking.old.ts
rm useGazeTracking.v2.ts  # Original v2 file no longer needed
git add .
git commit -m "Clean up backup face detection hook files"
git push origin main
```

## Rollback Procedure (If Issues Occur)

### 🚨 Emergency Rollback
If critical issues detected in production:

```bash
cd frontend/src/hooks
cp useGazeTracking.old.ts useGazeTracking.ts
git add useGazeTracking.ts
git commit -m "Rollback: Revert to old face detection implementation

Temporary rollback due to issues with MediaPipe Tasks Vision.
Investigating root cause.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
```

## Expected Results

### Before (Current State)
- ❌ Face detection completely fails
- ❌ Returns empty array `Array(0)` consistently
- ❌ Vision TEST unusable
- ❌ Error: tfjs runtime broken

### After (Expected State)
- ✅ Face detection works reliably
- ✅ Returns 478 landmarks with iris tracking
- ✅ Vision TEST fully functional
- ✅ Better cross-browser compatibility
- ✅ ~5MB smaller bundle size
- ✅ Better performance (native WASM)

## Success Criteria

- [ ] Face detection works in Chrome/Edge
- [ ] Face detection works in Firefox
- [ ] Face detection works in Safari (desktop)
- [ ] Face detection works on iOS Safari
- [ ] Face detection works on Android Chrome
- [ ] Calibration process completes successfully
- [ ] Vision TEST generates accurate gaze statistics
- [ ] No console errors during normal operation
- [ ] FPS remains at ~30 FPS
- [ ] 3+ users successfully complete Vision TEST

## Contact

If issues arise:
1. Check browser console for error messages
2. Review `FACE_DETECTION_ISSUE.md` for context
3. Review `MEDIAPIPE_TASKS_VISION_REFACTOR.md` for implementation details
4. Compare with backup file `useGazeTracking.old.ts`

## Completion Date

- **Implementation**: 2025-10-17
- **Testing**: _Pending_
- **Deployment**: _Pending_
- **Validation**: _Pending_
- **Cleanup**: _Pending_
