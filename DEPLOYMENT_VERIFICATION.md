# 배포 검증 가이드

## 🎯 수정 사항

**Commit**: `7dc8847c` - Render 빌드 명령어에 DB migration 자동 실행 추가

### 변경된 파일
- `render.yaml` (Line 38): buildCommand에 `python fix_session_code_column.py` 추가

---

## 📋 Render 배포 확인 절차

### 1️⃣ Render 대시보드 접속
https://dashboard.render.com/

### 2️⃣ 서비스 선택
**literacy-english-test-backend** (Python 백엔드)

### 3️⃣ 빌드 로그 확인 (Build Logs 탭)

#### ✅ **성공적인 빌드 로그 예시**:
```
==> Building...
cd backend && pip install -r requirements.txt && python fix_session_code_column.py

Collecting fastapi==0.119.1
...
Successfully installed [packages]

🔧 Starting session_code column fix...
📡 Connecting to database: aws-1-ap-northeast-2.pooler.supabase.com/postgres
✅ Database connection established

🔍 Checking current column definition...
   Current: session_code character varying(20)

🔧 Applying column length fix...
✅ Column altered successfully

🔍 Verifying the change...
   Updated: session_code character varying(50)

✅ SUCCESS: Column length updated to VARCHAR(50)

🎉 Migration completed successfully!

==> Build successful 🎉
```

#### ❌ **실패 시 확인할 에러**:
- Database connection failed → DATABASE_URL 환경변수 확인
- psycopg2 import error → requirements.txt 확인
- Permission denied → Supabase database 권한 확인

### 4️⃣ 서버 시작 로그 확인 (Runtime Logs 탭)

#### ✅ **정상 시작 로그**:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
```

---

## 🧪 기능 테스트

### Visual Perception Test 시작 테스트

#### 방법 1: 브라우저 콘솔
```javascript
// 1. https://literacy-test.netlify.app/ 접속
// 2. F12 → Console 탭
// 3. 다음 코드 실행:

const response = await fetch('https://literacy-english-test-backend.onrender.com/api/perception/sessions/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    student_id: 'test-uuid-1234-5678-90ab-cdef',
    grade: 1
  })
});

const data = await response.json();
console.log('✅ Response:', data);
console.log('📏 Session Code Length:', data.sessionCode?.length);
```

#### ✅ **성공 응답**:
```json
{
  "sessionId": "uuid...",
  "sessionCode": "PERCEPTION-abc123def456",  // 23자
  "passageId": "uuid...",
  "currentPhase": "introduction",
  "passageTitle": "...",
  "passageContent": "..."
}
```

#### ❌ **실패 시 확인**:
- 500 Error → Render 로그에서 DataError 확인
- 403/401 → 인증 문제 (별도 이슈)
- Timeout → Render Free Tier 스핀다운 (15분 대기 후 재시도)

### 방법 2: curl 테스트
```bash
curl -X POST https://literacy-english-test-backend.onrender.com/api/perception/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test-uuid-1234-5678-90ab-cdef",
    "grade": 1
  }'
```

---

## 🔍 문제 해결

### Migration이 실행되지 않음
1. Render 대시보드 → **Environment** 탭
2. `DATABASE_URL` 변수 확인:
   ```
   postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DEEP2025!@#$@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
   ```
3. Manual Deploy 클릭하여 재배포

### DataError 계속 발생
1. Supabase 대시보드 → SQL Editor
2. 다음 쿼리로 직접 확인:
   ```sql
   SELECT column_name, data_type, character_maximum_length
   FROM information_schema.columns
   WHERE table_name = 'perception_test_sessions'
   AND column_name = 'session_code';
   ```
3. 예상 결과: `character varying | 50`
4. 여전히 20이면 → 수동 migration 실행 필요

### 수동 Migration 실행 (최후의 수단)
```bash
# 로컬에서 실행
cd backend
export DATABASE_URL="postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DEEP2025!@#$@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
python fix_session_code_column.py
```

---

## 📊 검증 완료 체크리스트

- [ ] Render 빌드 로그에서 "✅ SUCCESS: Column length updated to VARCHAR(50)" 확인
- [ ] Render 런타임 로그에서 서버 정상 시작 확인
- [ ] Visual Perception Test API 호출 성공 (200 OK)
- [ ] 응답 데이터에서 sessionCode 길이 23자 확인
- [ ] 브라우저 콘솔 에러 없음

---

## 📌 추가 이슈

### English Adaptive Test (별도 확인 필요)
- Health check 실패는 Render Free Tier 스핀다운 가능성 높음
- Migration 완료 후 재테스트 필요

### Netlify 빌드
- 최근 커밋(61a78ca3)으로 ignore 패턴 수정됨
- 다음 backend 변경 시 빌드 스킵 확인
