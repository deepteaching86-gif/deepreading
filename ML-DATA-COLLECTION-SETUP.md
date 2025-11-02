# ✅ ML 데이터 수집 시스템 구현 완료

## 📋 구현 내용

### 1. 데이터베이스 스키마 (완료 ✅)

**3개 테이블 생성**:

```sql
-- ml_training_samples: 경량 특징 벡터 저장 (이미지 없음!)
-- ml_models: 모델 메타데이터 및 배포 추적
-- ml_data_consents: 사용자 동의 관리
```

**Supabase SQL 에디터에서 실행**:
- 파일: `backend/prisma/migrations/add-ml-training-data.sql`
- URL: https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/sql/new

### 2. 백엔드 API (완료 ✅)

**생성된 파일**:
- `backend/src/services/ml/lightweight-collector.service.ts` - 데이터 수집 로직
- `backend/src/controllers/ml/ml-data.controller.ts` - API 컨트롤러
- `backend/src/routes/ml-routes.ts` - 라우트 정의

**API 엔드포인트**:

```typescript
// 1. ML 샘플 수집
POST /api/v1/ml/collect
Body: {
  visionSessionId: string,
  sampleData: {
    // 메타데이터
    ageGroup: string,
    gender?: string,
    wearsGlasses?: boolean,
    deviceType: string,
    screenResolution?: string,

    // 특징 벡터 (MediaPipe에서 추출)
    irisLandmarks: any,        // 10 points per eye
    faceLandmarks: any,         // 68 compressed points
    headPose: any,              // { pitch, yaw, roll }
    calibrationPoints: any,     // Ground truth from calibration
    pupilDiameters?: { left: number | null, right: number | null },

    // 품질
    quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR',
    qualityScore: number,       // 0.0 - 1.0
    qualityNotes?: string
  },
  anonymize?: boolean,          // default: true
  requireConsent?: boolean      // default: false
}

// 2. 데이터셋 통계 조회
GET /api/v1/ml/stats
Response: {
  totalSamples: number,
  qualityDistribution: { EXCELLENT: 10, GOOD: 20, ... },
  ageDistribution: { '8-10': 5, '11-13': 10, ... },
  avgQualityScore: number,
  estimatedSize: { kb: 150, mb: "0.15", samples: 50 }
}

// 3. 샘플 목록 조회 (필터링)
GET /api/v1/ml/samples?quality=EXCELLENT&ageGroup=8-10&minQualityScore=0.9
Response: {
  samples: [...],
  total: number,
  limit: number,
  offset: number,
  hasMore: boolean
}
```

### 3. 저장 용량

**경량 설계**:
- **샘플당 크기**: 2-5KB (이미지 제외, 특징 벡터만!)
- **목표**: 10,000 샘플 = ~50MB
- **압축률**: 500배 (vs 이미지 포함 시 5MB/샘플)

**저장 데이터**:
```javascript
{
  irisLandmarks: [      // 홍채 랜드마크 (10 points/eye)
    { x, y, z },
    ...
  ],
  faceLandmarks: {      // 압축된 얼굴 랜드마크 (68 points)
    keypoints: [...],
    indices: [...],
    compressionRatio: 0.14
  },
  headPose: {           // 머리 자세
    pitch: 5.2,
    yaw: -3.1,
    roll: 1.5
  },
  calibrationPoints: [  // 캘리브레이션 포인트 (Ground Truth)
    { x, y, error, ... },
    ...
  ],
  pupilDiameters: {     // 동공 크기
    left: 4.2,
    right: 4.1
  }
}
```

## 🚀 다음 단계: 프론트엔드 연동

### 현재 상황
현재 `VisionGazeData`는 **시선 좌표만 저장**하고, ML 학습에 필요한 **얼굴/홍채 랜드마크는 저장하지 않습니다**.

### 프론트엔드 수정 필요 사항

**Vision Test 컴포넌트에서**:

```typescript
// 1. MediaPipe 데이터 추출 (캘리브레이션 완료 후)
const mlSampleData = {
  ageGroup: getUserAgeGroup(),  // '8-10', '11-13', '14-15'
  deviceType: navigator.userAgent,
  screenResolution: `${window.screen.width}x${window.screen.height}`,

  // MediaPipe에서 추출
  irisLandmarks: extractIrisLandmarks(),  // 현재 사용 중인 MediaPipe 데이터
  faceLandmarks: compressFaceLandmarks(faceMesh.results),
  headPose: calculateHeadPose(faceMesh.results),
  calibrationPoints: getCalibrationPoints(),  // 캘리브레이션에서 가져오기
  pupilDiameters: calculatePupilDiameters(),

  // 품질 평가
  quality: assessQuality(),     // 자동 평가 로직 필요
  qualityScore: 0.92,
  qualityNotes: 'Stable tracking, good lighting'
};

// 2. API 전송
const response = await fetch('/api/v1/ml/collect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    visionSessionId: currentSessionId,
    sampleData: mlSampleData,
    anonymize: true
  })
});

const result = await response.json();
console.log('ML 샘플 수집:', result.sampleId);
```

### 데이터 품질 평가 로직

```typescript
function assessQuality(calibrationPoints, headPose, irisLandmarks) {
  let score = 0;
  const notes = [];

  // 1. 캘리브레이션 정확도 (40%)
  const avgError = calibrationPoints.reduce((sum, p) => sum + p.error, 0) / calibrationPoints.length;
  if (avgError < 20) {
    score += 0.4;
    notes.push('Excellent calibration');
  } else if (avgError < 50) {
    score += 0.3;
    notes.push('Good calibration');
  }

  // 2. 머리 자세 안정성 (30%)
  const { pitch, yaw, roll } = headPose;
  if (Math.abs(pitch) < 10 && Math.abs(yaw) < 10 && Math.abs(roll) < 5) {
    score += 0.3;
    notes.push('Stable head pose');
  }

  // 3. 홍채 검출 신뢰도 (30%)
  const avgConfidence = irisLandmarks.reduce((sum, p) => sum + (p.confidence || 0.9), 0) / irisLandmarks.length;
  if (avgConfidence > 0.95) {
    score += 0.3;
    notes.push('Excellent iris detection');
  }

  let quality;
  if (score >= 0.95) quality = 'EXCELLENT';
  else if (score >= 0.85) quality = 'GOOD';
  else if (score >= 0.70) quality = 'FAIR';
  else quality = 'POOR';

  return { quality, score, notes: notes.join(', ') };
}
```

## 📊 사용 예시

### 1. 데이터 수집 확인
```bash
# 통계 조회
curl http://localhost:3000/api/v1/ml/stats

# 응답:
{
  "success": true,
  "stats": {
    "totalSamples": 127,
    "qualityDistribution": {
      "EXCELLENT": 45,
      "GOOD": 62,
      "FAIR": 15,
      "POOR": 5
    },
    "ageDistribution": {
      "8-10": 42,
      "11-13": 55,
      "14-15": 30
    },
    "avgQualityScore": 0.89,
    "estimatedSize": {
      "kb": 381,
      "mb": "0.37",
      "samples": 127
    }
  }
}
```

### 2. 고품질 샘플만 조회
```bash
curl "http://localhost:3000/api/v1/ml/samples?quality=EXCELLENT&minQualityScore=0.95&limit=10"
```

## 🎯 목표 달성

✅ **경량 저장**: 이미지 없이 특징 벡터만 저장 (2-5KB/샘플)
✅ **자동 품질 평가**: 캘리브레이션 + 머리 자세 + 홍채 신뢰도 기반
✅ **프라이버시 보호**: 익명화, 사용자 동의 관리
✅ **확장 가능**: 10,000 샘플 = 50MB (vs 50GB with images)
✅ **REST API**: 수집, 통계, 조회 엔드포인트 완비

## 📁 파일 구조

```
backend/
├── prisma/
│   ├── schema.prisma                    # ML 모델 추가됨 ✅
│   └── migrations/
│       └── add-ml-training-data.sql     # SQL 마이그레이션 ✅
├── src/
│   ├── services/ml/
│   │   └── lightweight-collector.service.ts  # 데이터 수집 로직 ✅
│   ├── controllers/ml/
│   │   └── ml-data.controller.ts        # API 컨트롤러 ✅
│   ├── routes/
│   │   └── ml-routes.ts                 # 라우트 정의 ✅
│   └── app.ts                           # ML 라우트 등록됨 ✅
```

## 🔧 테스트

로컬 개발 서버 시작 후:

```bash
# 백엔드 시작
cd backend
npm run dev

# API 테스트
curl http://localhost:3000/api/v1/ml/stats
```

---

**다음 작업**: 프론트엔드에서 MediaPipe 데이터를 API로 전송하도록 수정
