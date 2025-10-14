# Render 재배포 가이드 (Vision TEST 데이터베이스 동기화)

## 문제 상황

```
The table `public.vision_calibrations` does not exist in the current database.
```

**원인**: Render 백엔드의 Prisma Client가 오래된 스키마로 생성됨. 새로운 Vision TEST 테이블을 인식하지 못함.

## 해결 방법: Render 재배포

### 1단계: Supabase 테이블 확인 (선택사항)

1. Supabase Dashboard → SQL Editor 열기
2. `backend/prisma/migrations/verify-tables.sql` 내용 복사
3. 실행 후 5개 테이블 확인:
   - ✅ vision_calibration_adjustments
   - ✅ vision_calibrations
   - ✅ vision_gaze_data
   - ✅ vision_metrics
   - ✅ vision_test_sessions

### 2단계: Render 재배포

**방법 1: Render Dashboard에서 수동 재배포 (권장)**

1. https://dashboard.render.com 접속
2. `literacy-backend` 서비스 선택
3. 우측 상단 **"Manual Deploy"** 버튼 클릭
4. **"Deploy latest commit"** 선택
5. 배포 완료 대기 (약 2-3분)

**방법 2: Git Push로 자동 재배포**

```bash
# 빈 커밋으로 재배포 트리거
git commit --allow-empty -m "Trigger Render redeploy for Prisma schema update"
git push origin main
```

### 3단계: 재배포 확인

**Render Logs 확인**:
1. Render Dashboard → `literacy-backend` → "Logs" 탭
2. 배포 로그에서 확인:
   ```
   ✅ Running 'npm run build'
   ✅ prisma generate
   ✅ Build succeeded
   ```

**테스트 요청**:
1. Vision TEST 시작 시도
2. 개발자 도구 Network 탭 확인
3. `/api/vision/calibration/active/:userId` 요청 확인
4. ✅ 예상: 200 OK 또는 404 (캘리브레이션 없음)
5. ❌ 이전: 400 Bad Request with "table does not exist"

## 왜 이런 일이 발생했나?

### Prisma Client 생성 시점
```json
// package.json
"build": "tsc && prisma generate"
```

1. **최초 배포**: Render가 `prisma generate` 실행 → Prisma Client 생성
2. **문제**: 이때 DB에 `vision_*` 테이블이 없었음
3. **결과**: Prisma Client에 `vision_*` 모델이 포함되지 않음
4. **해결**: 재배포 → DB에 테이블 있음 → Prisma Client 재생성 → 모델 포함됨

### 배포 흐름
```
Render Deploy
  ↓
npm run build
  ↓
prisma generate (schema.prisma 읽기)
  ↓
Prisma Client 생성 (DB 스키마 기반)
  ↓
TypeScript 컴파일
  ↓
배포 완료
```

## 자주 묻는 질문

**Q: Supabase에서 마이그레이션을 실행했는데 왜 Render에 반영이 안 되나요?**
A: Prisma Client는 **빌드 시점**에 생성됩니다. 마이그레이션 후 반드시 재배포가 필요합니다.

**Q: 매번 마이그레이션마다 재배포해야 하나요?**
A: 네. Prisma 스키마가 변경되면 `prisma generate`를 다시 실행해야 합니다. 로컬에서는 수동으로, Render에서는 재배포로.

**Q: 로컬에서는 어떻게 하나요?**
A: 로컬에서는 마이그레이션 후 `npm run prisma:generate` 실행하면 됩니다.

## 트러블슈팅

### 재배포 후에도 에러가 계속되는 경우

1. **Render 환경 변수 확인**:
   - Dashboard → Environment 탭
   - `DATABASE_URL`이 올바른 Supabase 연결 문자열인지 확인
   - 예상: `postgresql://postgres.sxnjeqqvqbhueqbwsnpj:...@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`

2. **Prisma 스키마 파일 확인**:
   - `backend/prisma/schema.prisma`에 `model VisionCalibration` 등이 있는지 확인

3. **빌드 로그 확인**:
   - Render Logs에서 "prisma generate" 성공 여부 확인
   - 에러 메시지가 있는지 확인

4. **캐시 클리어 후 재배포**:
   - Render Dashboard → Settings → "Clear build cache & deploy"
