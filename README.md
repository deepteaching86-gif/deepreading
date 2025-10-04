# 📚 초중등 문해력 평가 시스템

**초등 1학년부터 중등 3학년까지** 학생들의 종합적인 문해력을 평가하고 분석하는 AI 기반 적응형 평가 시스템

---

## 🎯 프로젝트 개요

### 핵심 기능
- **적응형 평가 엔진**: IRT(Item Response Theory) 기반 실시간 난이도 조정
- **종합 문해력 평가**: 읽기 이해, 어휘력, 문법, 쓰기 능력 통합 평가
- **학습 분석 대시보드**: 학생별/클래스별 학습 데이터 시각화
- **AI 학습 추천**: 개인화된 학습 콘텐츠 추천
- **실시간 모니터링**: 교사/학부모용 학습 진도 추적

---

## 🏗️ 기술 스택

### Backend (Vercel)
- Node.js 20 + Express.js + TypeScript
- Prisma ORM + PostgreSQL 16 (Supabase)
- JWT 인증 + bcrypt

### Frontend (Netlify) - 예정
- Next.js 15 + React 18 + TypeScript
- Tailwind CSS v4 + Zustand

### Database & Services
- Supabase: PostgreSQL + Auth + Storage + Realtime

---

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone [repository-url]
cd "LITERACY TEST PROJECT"
```

### 2. 백엔드 설정
```bash
cd backend
npm install
cp .env.example .env
# .env 파일에 Supabase 정보 입력
npm run prisma:generate
```

### 3. Supabase 마이그레이션
[NEXT_STEPS.md](./NEXT_STEPS.md) 참고하여 SQL Editor에서 migration.sql 실행

### 4. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000
```

---

## 📚 문서

- **[NEXT_STEPS.md](./NEXT_STEPS.md)** - ⭐ 다음 단계 안내
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - 개발 환경 설정
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Vercel + Netlify 배포
- **[SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md)** - DB 마이그레이션
- **[MCP_SETUP.md](./MCP_SETUP.md)** - MCP 설정

---

## 🗄️ 데이터베이스 (25개 테이블)

- **사용자 관리** (6): users, students, teachers, parents, classes, user_relationships
- **문제 은행** (5): questions, question_passages, question_options, question_tags, curriculum_standards
- **평가 시스템** (4): assessments, assessment_questions, responses, scores
- **학습 분석** (5): student_progress, ability_history, domain_statistics, study_sessions, learning_recommendations
- **시스템 관리** (5): difficulty_calibrations, assessment_analytics, class_statistics, system_settings, refresh_tokens, audit_logs

---

## 🧮 IRT 알고리즘

3-Parameter Logistic Model로 학생 능력치(θ)를 실시간 추정하여 적응형 평가 제공

```
P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))
```

---

## 📈 개발 로드맵

- **Phase 1**: 인증 & 사용자 관리
- **Phase 2**: 문제 은행 시스템
- **Phase 3**: 평가 엔진 (IRT)
- **Phase 4**: 학습 분석
- **Phase 5**: 프론트엔드
- **Phase 6**: 배포 & 최적화

---

## 🚀 배포

- **Backend**: Vercel
- **Frontend**: Netlify
- **Database**: Supabase

자세한 내용은 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 참고

---

**즐거운 개발 되세요!** 🚀
