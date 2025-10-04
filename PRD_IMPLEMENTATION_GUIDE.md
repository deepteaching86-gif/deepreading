# 📋 PRD 구현 가이드

## 프로젝트 개요

**제품명**: 문해력 진단 평가 시스템
**버전**: 1.0
**목적**: 초등 1학년 ~ 중등 3학년 학생들의 언어적 수준을 객관적으로 측정하고 맞춤형 학습 방향 제시

---

## 🗄️ 데이터베이스 변경사항

### 기존 스키마 (25개 테이블) → 새 스키마 (10개 테이블)

PRD 요구사항에 맞춰 데이터베이스를 **단순화하고 최적화**했습니다.

| 구분 | 기존 | 새로운 (PRD 기반) |
|------|------|-------------------|
| 테이블 수 | 25개 | 10개 |
| 복잡도 | IRT 기반 적응형 평가 | PRD 명시된 진단 평가 |
| 초점 | 실시간 적응형 알고리즘 | 진단 결과 및 리포트 |

### 새로운 테이블 구조

#### 1. 사용자 관리 (2개)
- **users**: 모든 사용자 (학생, 교사, 학부모, 관리자)
- **students**: 학생 상세 정보 (학년, 학교, 생년월일 등)

#### 2. 평가 시스템 (4개)
- **test_templates**: 진단지 템플릿 (학년별)
- **questions**: 문항 (4개 영역: 어휘/독해/문법/추론)
- **test_sessions**: 평가 세션 (진행 상태 관리)
- **answers**: 학생 답안

#### 3. 결과 시스템 (2개)
- **test_results**: 진단 결과 (점수, 백분위, 영역별 점수)
- **statistics**: 통계 캐시 (백분위 계산용)

#### 4. 시스템 (2개)
- **refresh_tokens**: JWT 토큰 관리
- **audit_logs**: 감사 로그

---

## 📊 PRD 요구사항 매핑

### 1. 평가 영역 및 비중 (PRD Section 3.1)

```typescript
enum QuestionCategory {
  vocabulary  // 어휘력: 초1-2(40%), 초3-4(30%), 초5-6(25%), 중1-3(20%)
  reading     // 독해력: 초1-2(35%), 초3-4(40%), 초5-6(40%), 중1-3(35%)
  grammar     // 문법/어법: 초1-2(20%), 초3-4(15%), 초5-6(15%), 중1-3(15%)
  reasoning   // 추론/사고력: 초1-2(5%), 초3-4(15%), 초5-6(20%), 중1-3(30%)
}
```

**구현 방법:**
- `TestTemplate`에서 학년별 템플릿 생성
- `Question.category`로 영역 구분
- 영역별 문항 수를 비율에 맞게 할당

### 2. 평가 규모 및 시간 (PRD Section 3.2)

| 학년군 | 총 문항 | 시간 | 지문 길이 |
|--------|---------|------|-----------|
| 초1-2 | 15-20 | 20-25분 | 50-100자 |
| 초3-4 | 25-30 | 30-35분 | 150-250자 |
| 초5-6 | 30-35 | 40-45분 | 300-400자 |
| 중1-3 | 35-40 | 45-50분 | 500-700자 |

**구현:**
```typescript
TestTemplate {
  grade: 1-9           // 학년 (초1=1, 중3=9)
  totalQuestions: Int  // PRD 명시된 문항 수
  timeLimit: Int       // 분 단위
}

Question {
  passage: String?     // 지문 (독해 문항용, 길이 제한)
}
```

### 3. 문항 유형 분포 (PRD Section 3.3)

**선택형 70% | 단답형 20% | 서술형 10%**

```typescript
enum QuestionType {
  choice        // 선택형 (자동 채점)
  short_answer  // 단답형 (반자동 채점)
  essay         // 서술형 (교사 채점)
}
```

### 4. 채점 시스템 (PRD Section 4)

#### 채점 방식
```typescript
Answer {
  studentAnswer: String?  // 학생 답안
  isCorrect: Boolean?     // 정답 여부 (선택형/단답형)
  pointsEarned: Int       // 획득 점수
}
```

#### 결과 산출
```typescript
TestResult {
  // 원점수
  totalScore: Int         // 0-100점
  totalPossible: Int      // 만점
  percentage: Decimal     // 정답률

  // 상대 평가
  gradeLevel: Int?        // 1-9 등급
  percentile: Decimal?    // 백분위

  // 영역별 점수
  vocabularyScore: Int?
  readingScore: Int?
  grammarScore: Int?
  reasoningScore: Int?

  // 분석 결과
  strengths: Json?        // 강점 분석
  weaknesses: Json?       // 약점 분석
  recommendations: Json?  // 맞춤형 학습 제안
}
```

### 5. 기능 요구사항 (PRD Section 5)

#### 학생용 기능
- ✅ 학년 선택 및 평가 시작
- ✅ 문항별 답안 입력 (3가지 유형)
- ✅ 임시 저장 및 이어하기 (`TestSession.status`)
- ✅ 제한 시간 타이머 (`TestTemplate.timeLimit`)
- ✅ 문항 북마크 (프론트엔드에서 구현)
- ✅ 평가 완료 후 결과 즉시 확인

#### 교사용 기능
- ✅ 학생별 평가 진행 모니터링 (`TestSession.status`)
- ✅ 서술형 답안 채점 인터페이스
- ✅ 학급/학년 통계 분석 (`Statistic` 테이블)
- ✅ 개별 학생 성장 추이 확인
- ✅ 결과 리포트 출력/다운로드
- ✅ 문항 은행 관리 (`TestTemplate`, `Question`)

#### 학부모용 기능
- ✅ 자녀 평가 결과 확인 (`Student.parentId` 관계)
- ✅ 영역별 강점/약점 분석
- ✅ 맞춤형 가정 학습 가이드
- ✅ 추천 학습 자료 제공

---

## 🚀 구현 로드맵

### Phase 1: 기본 인증 & 사용자 관리 (1-2주)

**Week 1: 인증 시스템**
```bash
backend/src/modules/auth/
├── auth.controller.ts   # 회원가입, 로그인, 로그아웃
├── auth.service.ts      # JWT 발급/검증, bcrypt 암호화
├── auth.middleware.ts   # JWT 인증 미들웨어
├── auth.dto.ts         # Zod 스키마 (입력 검증)
└── auth.routes.ts      # 라우팅
```

**API 엔드포인트:**
```typescript
POST   /api/v1/auth/register        // 회원가입
POST   /api/v1/auth/login           // 로그인
POST   /api/v1/auth/refresh         // 토큰 갱신
POST   /api/v1/auth/logout          // 로그아웃
GET    /api/v1/auth/me              // 현재 사용자 정보
```

**Week 2: 사용자 관리**
```bash
backend/src/modules/users/
└── students/
    ├── students.controller.ts   # CRUD
    ├── students.service.ts      # 비즈니스 로직
    └── students.routes.ts
```

**API 엔드포인트:**
```typescript
GET    /api/v1/students             // 학생 목록 (교사용)
GET    /api/v1/students/:id         // 학생 상세
POST   /api/v1/students             // 학생 등록
PATCH  /api/v1/students/:id         // 학생 수정
DELETE /api/v1/students/:id         // 학생 삭제
```

---

### Phase 2: 진단지 & 문항 관리 (2-3주)

**Week 3: 진단지 템플릿**
```bash
backend/src/modules/templates/
├── templates.controller.ts
├── templates.service.ts
└── templates.routes.ts
```

**API 엔드포인트:**
```typescript
GET    /api/v1/templates            // 템플릿 목록
GET    /api/v1/templates/:id        // 템플릿 상세
POST   /api/v1/templates            // 템플릿 생성 (관리자)
PATCH  /api/v1/templates/:id        // 템플릿 수정
DELETE /api/v1/templates/:id        // 템플릿 삭제
GET    /api/v1/templates/by-grade/:grade  // 학년별 템플릿
```

**Week 4-5: 문항 관리**
```bash
backend/src/modules/questions/
├── questions.controller.ts
├── questions.service.ts
└── questions.routes.ts
```

**API 엔드포인트:**
```typescript
GET    /api/v1/questions                    // 문항 목록
GET    /api/v1/questions/:id                // 문항 상세
POST   /api/v1/questions                    // 문항 생성
PATCH  /api/v1/questions/:id                // 문항 수정
DELETE /api/v1/questions/:id                // 문항 삭제
GET    /api/v1/questions/by-template/:id    // 템플릿별 문항
POST   /api/v1/questions/bulk               // 대량 등록
```

---

### Phase 3: 평가 진행 시스템 (2-3주)

**Week 6-7: 평가 세션 관리**
```bash
backend/src/modules/sessions/
├── sessions.controller.ts
├── sessions.service.ts
└── sessions.routes.ts
```

**API 엔드포인트:**
```typescript
POST   /api/v1/sessions/start               // 평가 시작
GET    /api/v1/sessions/:id                 // 세션 상세
PATCH  /api/v1/sessions/:id/pause           // 임시 저장
PATCH  /api/v1/sessions/:id/resume          // 이어하기
POST   /api/v1/sessions/:id/submit          // 평가 제출
GET    /api/v1/sessions/student/:studentId  // 학생별 세션 목록
```

**Week 8: 답안 제출 & 관리**
```bash
backend/src/modules/answers/
├── answers.controller.ts
├── answers.service.ts
└── answers.routes.ts
```

**API 엔드포인트:**
```typescript
POST   /api/v1/answers                      // 답안 제출
PATCH  /api/v1/answers/:id                  // 답안 수정
GET    /api/v1/answers/session/:sessionId   // 세션별 답안
POST   /api/v1/answers/auto-grade           // 자동 채점 (선택형)
```

---

### Phase 4: 채점 & 결과 시스템 (2-3주)

**Week 9: 자동 채점 엔진**
```bash
backend/src/modules/grading/
├── grading.service.ts       # 채점 로직
├── auto-grading.service.ts  // 선택형 자동 채점
└── manual-grading.service.ts // 서술형 수동 채점
```

**Week 10: 결과 생성**
```bash
backend/src/modules/results/
├── results.controller.ts
├── results.service.ts
├── statistics.service.ts    // 백분위 계산
└── results.routes.ts
```

**API 엔드포인트:**
```typescript
GET    /api/v1/results/:sessionId           // 결과 조회
GET    /api/v1/results/student/:studentId   // 학생별 결과 목록
GET    /api/v1/results/:sessionId/report    // 상세 리포트
GET    /api/v1/results/:sessionId/pdf       // PDF 다운로드
POST   /api/v1/results/:sessionId/calculate // 결과 재계산
```

**Week 11: 통계 시스템**
```bash
backend/src/modules/statistics/
├── statistics.controller.ts
├── statistics.service.ts
└── statistics.routes.ts
```

**API 엔드포인트:**
```typescript
GET    /api/v1/statistics/grade/:grade      // 학년별 통계
GET    /api/v1/statistics/template/:id      // 템플릿별 통계
POST   /api/v1/statistics/refresh           // 통계 갱신
GET    /api/v1/statistics/percentile        // 백분위 조회
```

---

### Phase 5: 프론트엔드 (4-6주)

**Week 12-13: 기본 레이아웃 & 인증**
- Next.js 프로젝트 설정
- Tailwind CSS v4 디자인 시스템 적용
- 로그인/회원가입 페이지
- 대시보드 레이아웃

**Week 14-15: 학생용 UI**
- 평가 시작 페이지
- 문항 풀이 인터페이스
- 타이머 및 진행 상황 표시
- 결과 확인 페이지

**Week 16-17: 교사용 대시보드**
- 학생 관리
- 진단지 관리
- 채점 인터페이스
- 통계 대시보드

---

### Phase 6: 배포 & 최적화 (1-2주)

**Week 18: 배포**
- Vercel 백엔드 배포
- Netlify 프론트엔드 배포
- 환경 변수 설정
- CI/CD 파이프라인

**Week 19: 최적화 & 테스트**
- 성능 최적화
- 보안 점검
- 사용자 테스트
- 버그 수정

---

## 📋 데이터베이스 마이그레이션

### 1. 기존 마이그레이션 백업

```bash
cd backend
mv migration.sql migration.old.sql
mv prisma/schema.prisma prisma/schema.old.prisma
```

### 2. 새 스키마 적용

```bash
# 새 스키마 복사
cp prisma/schema-prd.prisma prisma/schema.prisma

# Prisma 클라이언트 생성
npm run prisma:generate

# 마이그레이션 SQL 생성
npm run prisma:migrate
```

### 3. Supabase SQL Editor에서 실행

1. Supabase Dashboard → SQL Editor
2. `migration-prd.sql` 파일 내용 복사
3. 실행 (Run)
4. Table Editor에서 10개 테이블 확인

---

## 🎯 우선순위 기능 구현 순서

### 🔥 P0 (필수, Week 1-3)
1. ✅ 사용자 인증 (로그인/회원가입)
2. ✅ 학생 등록 및 관리
3. ✅ 진단지 템플릿 생성
4. ✅ 문항 등록

### ⚡ P1 (핵심, Week 4-8)
5. ✅ 평가 세션 시작/진행
6. ✅ 답안 제출
7. ✅ 자동 채점 (선택형)
8. ✅ 결과 생성 및 조회

### 🎨 P2 (중요, Week 9-15)
9. ✅ 서술형 수동 채점
10. ✅ 통계 및 백분위 계산
11. ✅ 프론트엔드 학생용 UI
12. ✅ 프론트엔드 교사용 대시보드

### 🚀 P3 (개선, Week 16-19)
13. ✅ 학부모용 리포트
14. ✅ 성장 추이 분석
15. ✅ PDF 리포트 생성
16. ✅ 배포 및 최적화

---

## 📊 성공 지표 (KPI) 추적

| KPI | 목표 | 측정 방법 |
|-----|------|-----------|
| 사용자 만족도 | 4.0/5.0 이상 | 설문 조사 |
| 평가 완료율 | 95% 이상 | `TestSession.status = 'completed'` 비율 |
| 재사용률 | 70% 이상 (3개월 내) | 동일 학생의 평가 횟수 |
| 시스템 안정성 | 99.5% 이상 | Vercel Analytics |

---

## 🔗 관련 문서

- [PRD 원문](./PRD.md) - 제품 요구사항 문서
- [데이터베이스 설계](./backend/prisma/schema.prisma) - Prisma 스키마
- [API 문서](./API_DOCUMENTATION.md) - REST API 명세
- [배포 가이드](./DEPLOYMENT_GUIDE.md) - Vercel + Netlify 배포

---

**PRD 기반 구현 시작!** 🚀

이제 19주 로드맵을 따라 단계별로 구현하면 됩니다.
