# 🚀 초중등 문해력 평가 시스템 - 시작 가이드

이 가이드를 따라하면 개발 환경을 완벽하게 구축할 수 있습니다.

## 📋 필수 준비물

### 소프트웨어
- [Node.js](https://nodejs.org/) >= 20.0.0
- [Git](https://git-scm.com/)
- 코드 에디터 (VS Code 권장)

### 계정
- [Supabase](https://supabase.com) 계정 (무료)

## 🎯 빠른 시작 (5분)

### 1단계: 프로젝트 클론 (이미 완료)

```bash
# 현재 위치
cd "C:\Users\owner\Downloads\LITERACY TEST PROJECT"
```

### 2단계: Supabase 프로젝트 생성

1. https://app.supabase.com 접속 및 로그인
2. **New Project** 클릭
3. 프로젝트 설정:
   ```
   Name: literacy-assessment
   Database Password: [강력한 비밀번호 생성 및 저장!]
   Region: Northeast Asia (Seoul)
   Pricing: Free
   ```
4. **Create new project** 클릭 (약 2분 소요)

### 3단계: Supabase 연결 정보 복사

프로젝트 생성 완료 후:

**Settings → API** 메뉴에서:
- ✅ Project URL 복사
- ✅ anon public key 복사
- ✅ service_role key 복사 (⚠️ 비밀!)

**Settings → Database → Connection string → URI**:
- ✅ Connection string 복사

### 4단계: 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 파일 생성
cp .env.example .env
```

### 5단계: .env 파일 수정

`.env` 파일을 열고 Supabase 정보 입력:

```env
# Database URL
DATABASE_URL="postgresql://postgres:[비밀번호]@db.[프로젝트-ID].supabase.co:5432/postgres?schema=public"

# Supabase
SUPABASE_URL="https://[프로젝트-ID].supabase.co"
SUPABASE_ANON_KEY="eyJhbG..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# JWT Secret (32자 이상)
JWT_SECRET="아무거나-32자-이상-입력-하세요-example-key"
```

### 6단계: 데이터베이스 초기화

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션 (테이블 생성)
npm run prisma:migrate
```

마이그레이션 이름 입력 시: `init` 입력

### 7단계: 서버 실행

```bash
npm run dev
```

✅ 성공 메시지:
```
✅ Database connected successfully
✅ Supabase client initialized
🚀 Server running on port 3000
```

### 8단계: 테스트

새 터미널 창에서:
```bash
curl http://localhost:3000/health
```

응답:
```json
{
  "status": "ok",
  "timestamp": "2025-01-03T...",
  "environment": "development",
  "version": "v1"
}
```

## ✅ 설치 완료!

축하합니다! 백엔드 서버가 성공적으로 실행되고 있습니다.

---

## 📚 상세 가이드

### Supabase 대시보드 활용

**테이블 확인**:
1. Supabase 대시보드 → **Table Editor**
2. 25개 테이블 확인:
   - users, students, teachers, parents
   - questions, assessments, responses, scores
   - student_progress, ability_history
   - ... 등

**SQL Editor 사용**:
```sql
-- 테이블 목록 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- 사용자 수 확인
SELECT COUNT(*) FROM users;
```

### Prisma Studio (데이터베이스 GUI)

```bash
npm run prisma:studio
```

브라우저에서 `http://localhost:5555` 자동 열림
→ 테이블 데이터를 GUI로 확인/수정 가능

### 개발 워크플로우

#### 스키마 변경 시

```bash
# 1. prisma/schema.prisma 파일 수정
# 2. 마이그레이션 생성 및 적용
npm run prisma:migrate
# 3. Prisma Client 재생성
npm run prisma:generate
```

#### 테스트 실행

```bash
npm test
```

#### 프로덕션 빌드

```bash
npm run build
npm start
```

---

## 🔧 다음 개발 작업

### 우선순위 1: 인증 API 구현

```
src/modules/auth/
├── auth.controller.ts   # 회원가입, 로그인, 로그아웃
├── auth.service.ts      # 비즈니스 로직
├── auth.middleware.ts   # JWT 검증
├── auth.dto.ts         # 데이터 검증 (Zod)
└── auth.routes.ts      # 라우팅
```

### 우선순위 2: 사용자 관리 API

```
src/modules/users/
src/modules/students/
src/modules/teachers/
```

### 우선순위 3: 문제 은행 시스템

```
src/modules/questions/
```

---

## 🐛 문제 해결

### "Cannot find module" 에러
```bash
npm install
npm run prisma:generate
```

### 데이터베이스 연결 실패
1. `.env` 파일의 `DATABASE_URL` 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 비밀번호에 특수문자가 있다면 URL 인코딩 필요

### 포트 이미 사용 중
```bash
# 포트 변경
# .env 파일에서 PORT=3001 로 변경
```

### Prisma 마이그레이션 충돌
```bash
# 개발 환경에서만 사용!
npx prisma migrate reset
npm run prisma:migrate
```

---

## 📁 프로젝트 구조

```
LITERACY TEST PROJECT/
├── backend/
│   ├── src/
│   │   ├── config/              # 설정 (DB, Supabase, Logger)
│   │   ├── modules/             # 기능 모듈 (Auth, Users, Questions...)
│   │   ├── common/              # 공통 (Middleware, Utils, Types)
│   │   ├── algorithms/          # IRT, 적응형 알고리즘
│   │   ├── app.ts              # Express 앱
│   │   └── server.ts           # 서버 시작
│   ├── prisma/
│   │   └── schema.prisma       # 데이터베이스 스키마
│   ├── package.json
│   └── SUPABASE_SETUP.md       # Supabase 상세 가이드
│
└── frontend/                    # (예정)
```

---

## 🔗 유용한 링크

- [Backend README](./backend/README.md)
- [Supabase Setup Guide](./backend/SUPABASE_SETUP.md)
- [**MCP Setup Guide**](./MCP_SETUP.md) - AI 어시스턴트 연동 가이드
- [Supabase Dashboard](https://app.supabase.com)
- [Prisma Docs](https://www.prisma.io/docs)

---

## 💡 팁

### VS Code 확장 프로그램 추천

- **Prisma**: Prisma 스키마 자동완성
- **ESLint**: 코드 품질
- **Prettier**: 코드 포맷팅
- **Thunder Client**: API 테스트 (Postman 대안)

### 개발 모드 팁

```bash
# 서버 자동 재시작 (ts-node-dev)
npm run dev

# 다른 터미널에서 Prisma Studio 열기
npm run prisma:studio

# 또 다른 터미널에서 테스트
npm run test:watch
```

---

## 🎓 학습 리소스

- **Node.js + Express**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/
- **Prisma**: https://www.prisma.io/docs
- **Supabase**: https://supabase.com/docs
- **JWT**: https://jwt.io/

---

## 👥 팀 & 지원

질문이나 문제가 있으면:
1. GitHub Issues 생성
2. 팀 Slack 채널
3. [이메일]

즐거운 개발 되세요! 🚀
