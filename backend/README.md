# 📚 Literacy Assessment System - Backend API

초등 1학년부터 중등 3학년까지의 종합 문해력 평가 시스템 백엔드 API

## 🎯 프로젝트 개요

이 프로젝트는 학생들의 문해력(독해, 어휘, 문법, 쓰기)를 평가하고 분석하는 시스템의 백엔드 서버입니다. IRT(Item Response Theory) 기반의 적응형 평가 엔진을 포함하고 있습니다.

### 주요 기능

- ✅ JWT 기반 인증 시스템
- ✅ 역할 기반 접근 제어 (RBAC)
- ✅ 적응형 평가 엔진 (IRT)
- ✅ 문제 은행 시스템
- ✅ 자동 채점 시스템
- ✅ 학습 분석 및 추천
- ✅ 실시간 진행도 추적

## 🛠️ 기술 스택

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Logging**: Winston

## 📋 사전 요구사항

- Node.js >= 20.0.0
- PostgreSQL >= 16.0
- Redis >= 7.0
- npm 또는 yarn

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
cd backend
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 값을 설정합니다:

```bash
cp .env.example .env
```

필수 환경 변수:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `JWT_SECRET`: JWT 서명 키
- `REDIS_HOST`: Redis 서버 호스트
- `REDIS_PORT`: Redis 서버 포트

### 3. 데이터베이스 마이그레이션

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션 실행
npm run prisma:migrate

# 초기 데이터 삽입 (선택사항)
npm run prisma:seed
```

### 4. 개발 서버 실행

```bash
npm run dev
```

서버는 `http://localhost:3000`에서 실행됩니다.

### 5. 프로덕션 빌드

```bash
npm run build
npm start
```

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── config/              # 설정 파일
│   ├── modules/             # 기능 모듈
│   │   ├── auth/           # 인증
│   │   ├── users/          # 사용자 관리
│   │   ├── students/       # 학생 관리
│   │   ├── teachers/       # 교사 관리
│   │   ├── questions/      # 문제 관리
│   │   ├── assessments/    # 평가 시스템
│   │   ├── responses/      # 응답 처리
│   │   ├── scores/         # 점수 및 결과
│   │   ├── progress/       # 학습 진행도
│   │   └── analytics/      # 분석 및 통계
│   ├── common/             # 공통 유틸리티
│   │   ├── middleware/     # 미들웨어
│   │   ├── utils/          # 유틸 함수
│   │   └── types/          # 타입 정의
│   ├── algorithms/         # 알고리즘
│   │   ├── irt/           # IRT 알고리즘
│   │   ├── adaptive/      # 적응형 평가
│   │   └── recommendation/ # 학습 추천
│   └── database/           # 데이터베이스
│       ├── migrations/     # 마이그레이션
│       └── seeds/          # 시드 데이터
├── tests/                  # 테스트
├── prisma/                 # Prisma 스키마
└── package.json
```

## 🔑 API 엔드포인트

### 인증 (Authentication)

```
POST   /api/v1/auth/register      # 회원가입
POST   /api/v1/auth/login         # 로그인
POST   /api/v1/auth/logout        # 로그아웃
POST   /api/v1/auth/refresh       # 토큰 갱신
GET    /api/v1/auth/me            # 현재 사용자 정보
```

### 사용자 (Users)

```
GET    /api/v1/users              # 사용자 목록
POST   /api/v1/users              # 사용자 생성
GET    /api/v1/users/:id          # 사용자 상세
PUT    /api/v1/users/:id          # 사용자 수정
DELETE /api/v1/users/:id          # 사용자 삭제
```

### 문제 (Questions)

```
GET    /api/v1/questions          # 문제 목록
POST   /api/v1/questions          # 문제 생성
GET    /api/v1/questions/:id      # 문제 상세
PUT    /api/v1/questions/:id      # 문제 수정
DELETE /api/v1/questions/:id      # 문제 삭제
```

### 평가 (Assessments)

```
GET    /api/v1/assessments        # 평가 목록
POST   /api/v1/assessments        # 평가 생성
GET    /api/v1/assessments/:id    # 평가 상세
POST   /api/v1/assessments/:id/start    # 평가 시작
GET    /api/v1/assessments/:id/next-question  # 다음 문제
POST   /api/v1/assessments/:id/responses      # 답변 제출
POST   /api/v1/assessments/:id/submit         # 평가 제출
GET    /api/v1/assessments/:id/result         # 결과 조회
```

더 많은 API 정보는 `/api/v1/docs`에서 Swagger 문서를 참조하세요.

## 🗄️ 데이터베이스 스키마

### 주요 테이블

- `users` - 사용자 (학생, 교사, 학부모, 관리자)
- `students` - 학생 프로필
- `teachers` - 교사 프로필
- `classes` - 학급
- `questions` - 문제
- `assessments` - 평가
- `responses` - 학생 응답
- `scores` - 점수 및 결과
- `student_progress` - 학습 진행도
- `ability_history` - 능력치 변화 이력

전체 스키마는 `prisma/schema.prisma` 파일을 참조하세요.

## 🧪 테스트

```bash
# 단위 테스트
npm test

# 테스트 커버리지
npm run test:coverage

# 테스트 와치 모드
npm run test:watch
```

## 📊 적응형 평가 알고리즘

### IRT (Item Response Theory)

문제 난이도와 학생 능력치를 추정하는 3-파라미터 로지스틱 모델 사용:

```
P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
```

- `θ` (theta): 학생의 능력치
- `a`: 문제의 변별도 (discrimination)
- `b`: 문제의 난이도 (difficulty)
- `c`: 추측도 (guessing parameter)

### 적응형 선택 알고리즘

1. 초기 능력치: 학년 기반 또는 0.5
2. 현재 능력치에 가까운 난이도의 문제 출제
3. 응답 분석 후 능력치 업데이트
4. 다음 문제 난이도 조정
5. 반복

## 🔒 보안

- 비밀번호: bcrypt (10 rounds)
- JWT: HS256 알고리즘
- CSRF 보호
- Rate Limiting
- Helmet.js (보안 헤더)
- SQL Injection 방지 (Prisma)
- XSS 방지

## 📝 로깅

Winston을 사용한 구조화된 로깅:

```typescript
logger.info('Assessment started', {
  assessmentId: 123,
  studentId: 456,
  type: 'diagnostic'
});
```

로그 레벨: `error`, `warn`, `info`, `http`, `verbose`, `debug`

## 🚀 배포

### Docker

```bash
# 이미지 빌드
docker build -t literacy-api .

# 컨테이너 실행
docker run -p 3000:3000 --env-file .env literacy-api
```

### Docker Compose

```bash
docker-compose up -d
```

## 🤝 기여 가이드

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 👥 팀

- Backend Lead: [이름]
- Database Architect: [이름]
- Algorithm Engineer: [이름]

## 📞 문의

프로젝트 관련 문의: [이메일]

## 🔗 관련 링크

- [Frontend Repository](#)
- [API Documentation](#)
- [Deployment Guide](#)
