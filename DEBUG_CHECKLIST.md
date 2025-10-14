# Vision TEST 데이터베이스 에러 디버깅 체크리스트

## 🚨 현재 에러
```
The table `public.vision_calibrations` does not exist in the current database.
```

## 🔍 원인 진단 체크리스트

### ✅ 1단계: Supabase 테이블 확인

**Supabase Dashboard → SQL Editor에서 실행**:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'vision%'
ORDER BY table_name;
```

**결과 확인**:
- [ ] 0개 행 → **테이블 없음** (2단계로)
- [ ] 5개 행 → **테이블 있음** (3단계로)
- [ ] 1-4개 행 → **일부만 있음** (migration-safe.sql 재실행 필요)

---

### ✅ 2단계: 테이블 없는 경우 - 마이그레이션 실행

**Supabase SQL Editor에서**:
1. `backend/prisma/migrations/20250614_add_vision_test_models/migration-safe.sql` 전체 복사
2. SQL Editor에 붙여넣기
3. 실행 (Run 버튼)
4. 결과 확인:
   - "Success" 메시지
   - 1단계로 돌아가서 테이블 확인

---

### ✅ 3단계: 테이블 있는 경우 - DATABASE_URL 확인

**문제**: Render가 다른 데이터베이스에 연결되어 있을 수 있음

**Render Dashboard 확인**:
1. https://dashboard.render.com
2. `literacy-backend` 서비스
3. **Environment** 탭
4. `DATABASE_URL` 값 확인

**올바른 값**:
```
postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025!@#$SecureDB@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**중요**: 
- `sxnjeqqvqbhueqbwsnpj` 프로젝트 ID가 맞는지 확인
- pooler 주소가 `aws-1-ap-northeast-2.pooler.supabase.com`인지 확인

---

### ✅ 4단계: Render 재배포 상태 확인

**Render Dashboard**:
1. `literacy-backend` 서비스
2. 최상단 배포 상태:
   - 🟡 "Build in Progress" → 대기
   - 🟢 "Deploy live" → 완료
   - 🔴 "Build failed" → 로그 확인

**Events 탭 확인**:
- 최근 배포 이벤트 시간 확인
- 예상: 23:50 이후 배포 시작
- GitHub 커밋: "Add: Vision TEST verification and Render redeploy guides" (048875eb)

---

### ✅ 5단계: Render 빌드 로그 확인

**Render Dashboard → Logs 탭**:

**찾아야 할 내용**:
```
==> Running 'cd backend && npm install && npx prisma generate && npm run build'
Prisma schema loaded from prisma/schema.prisma
Generated Prisma Client (5.22.0)
```

**확인 사항**:
- [ ] `prisma generate` 성공
- [ ] `npm run build` 성공
- [ ] 에러 없이 완료

---

### ✅ 6단계: Prisma 스키마 파일 확인

**로컬에서 확인**:
```bash
grep -A 5 "model VisionCalibration" backend/prisma/schema.prisma
```

**예상 결과**: VisionCalibration 모델이 존재해야 함

---

## 🎯 가능한 시나리오

### 시나리오 A: Supabase에 테이블 없음
→ migration-safe.sql 재실행

### 시나리오 B: Render가 재배포 안 됨
→ GitHub 푸시 확인 또는 수동 재배포

### 시나리오 C: DATABASE_URL이 다름
→ Render 환경 변수 수정 후 재배포

### 시나리오 D: Prisma 스키마에 모델 없음
→ schema.prisma 확인 (거의 불가능)

---

## 📊 현재까지 진행 상황

### 완료됨
- ✅ migration-safe.sql 작성
- ✅ GitHub 푸시 (048875eb)
- ✅ FPS 최적화
- ✅ 얼굴 위치 UI 개선

### 확인 필요
- ❓ Supabase 테이블 실제 존재 여부
- ❓ Render 재배포 완료 여부
- ❓ DATABASE_URL 일치 여부

---

## 🚀 다음 단계

1. **지금 바로**: Supabase에서 check-vision-tables.sql 실행
2. **결과에 따라**:
   - 테이블 없음 → migration-safe.sql 실행
   - 테이블 있음 → Render 재배포 완료 대기
3. **재배포 완료 후**: Vision TEST 테스트
