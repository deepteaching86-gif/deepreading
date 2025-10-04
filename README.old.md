# 📚 초중등 문해력 평가 시스템

초등 1학년부터 중등 3학년까지의 종합 문해력을 평가하고 분석하는 시스템

## 🎯 프로젝트 개요

이 시스템은 학생들의 문해력(독해, 어휘, 문법, 쓰기)를 종합적으로 평가하고, IRT(Item Response Theory) 기반의 적응형 평가를 제공하며, 개인 맞춤형 학습 추천을 제공합니다.

### 주요 기능

#### 학생용
- ✅ 적응형 평가 (개인 수준에 맞는 문제 출제)
- ✅ 실시간 피드백 및 해설
- ✅ 상세한 결과 리포트
- ✅ 영역별 능력 분석
- ✅ 맞춤 학습 추천

#### 교사용
- ✅ 학급 관리 대시보드
- ✅ 학생별 성취도 분석
- ✅ 평가 생성 및 배정
- ✅ 문제 은행 관리
- ✅ 통계 및 리포트

#### 학부모용
- ✅ 자녀 학습 현황 모니터링
- ✅ 성장 추이 확인
- ✅ 강점/약점 영역 파악

## 🛠️ 기술 스택

### Backend
- Node.js 20 + TypeScript
- Express.js
- PostgreSQL 16 + Prisma
- Redis 7
- JWT Authentication

### Frontend (예정)
- Next.js 15 + React 18
- TypeScript
- Tailwind CSS v4
- Zustand (State Management)

## 📁 프로젝트 구조

```
LITERACY TEST PROJECT/
├── backend/                    # 백엔드 API 서버
│   ├── src/
│   │   ├── config/            # 설정 파일
│   │   ├── modules/           # 기능 모듈
│   │   ├── common/            # 공통 유틸리티
│   │   ├── algorithms/        # IRT, 적응형 알고리즘
│   │   └── database/          # 마이그레이션, 시드
│   ├── prisma/                # Prisma 스키마
│   ├── tests/                 # 테스트
│   └── README.md
│
└── frontend/                   # 프론트엔드 (예정)
    └── src/
        ├── app/               # Next.js 앱
        ├── components/        # React 컴포넌트
        ├── lib/              # API 클라이언트, Hooks
        └── styles/           # Tailwind CSS
```

## 🚀 시작하기

### 사전 요구사항

- Node.js >= 20.0.0
- PostgreSQL >= 16.0
- Redis >= 7.0
- npm 또는 yarn

### 설치 및 실행

자세한 내용은 각 디렉토리의 README를 참조하세요:
- [Backend README](./backend/README.md)

## 📊 데이터베이스 설계

### 핵심 테이블 (25개)

#### 사용자 관리
- `users` - 사용자 (학생, 교사, 학부모, 관리자)
- `students` - 학생 프로필
- `teachers` - 교사 프로필
- `parents` - 학부모 프로필
- `classes` - 학급
- `user_relationships` - 사용자 관계

#### 문제 은행
- `questions` - 문제
- `question_passages` - 지문
- `question_options` - 선택지
- `question_tags` - 태그
- `curriculum_standards` - 교육과정 기준

#### 평가 시스템
- `assessments` - 평가
- `assessment_questions` - 평가-문제 매핑
- `responses` - 학생 응답
- `scores` - 점수 및 결과

#### 학습 데이터
- `student_progress` - 학습 진행도
- `ability_history` - 능력치 변화 이력
- `domain_statistics` - 영역별 통계
- `study_sessions` - 학습 세션
- `learning_recommendations` - 학습 추천

#### 시스템
- `difficulty_calibration` - 난이도 보정
- `assessment_analytics` - 평가 분석
- `class_statistics` - 학급 통계
- `system_settings` - 시스템 설정
- `refresh_tokens` - 리프레시 토큰
- `audit_logs` - 감사 로그

## 🎓 평가 알고리즘

### IRT (Item Response Theory)

3-파라미터 로지스틱 모델을 사용하여 학생의 능력치를 정확하게 추정:

```
P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
```

- `θ` (theta): 학생의 능력치 (0.0 ~ 1.0)
- `a`: 문제의 변별도 (discrimination)
- `b`: 문제의 난이도 (difficulty)
- `c`: 추측도 (guessing parameter, 일반적으로 0.25)

### 적응형 평가 프로세스

1. **초기화**: 학년 기반 초기 능력치 설정
2. **문제 선택**: 현재 능력치와 유사한 난이도의 문제 출제
3. **응답 분석**: 정답/오답에 따른 능력치 업데이트
4. **난이도 조정**:
   - 정답률 70%+ → 난이도 상향 (+0.1)
   - 정답률 50% 이하 → 난이도 하향 (-0.1)
5. **반복**: 목표 문항 수까지 반복
6. **최종 평가**: 최종 능력치 및 성취도 산출

## 📱 UI/UX 디자인

### 디자인 시스템

- **Primary Color**: 보라색 (oklch(0.3394 0.1817 299.4789))
- **Accent Color**: 핑크 (oklch(0.9439 0.0319 309.9407))
- **Typography**: Plus Jakarta Sans, Lora, IBM Plex Mono
- **Radius**: 1.4rem (부드러운 느낌)
- **다크 모드**: 완벽 지원

### 주요 화면

1. **학생 평가 인터페이스**
   - 평가 시작 화면
   - 문제 풀이 (지문 + 문제 + 선택지)
   - 진행바 & 타이머
   - 즉시 피드백 모달
   - 결과 리포트

2. **교사 대시보드**
   - 학급 개요
   - 학생별 성취도
   - 평가 관리
   - 통계 차트

3. **결과 분석**
   - 종합 점수
   - 영역별 성취도
   - 성장 추이 그래프
   - 레이더 차트

## 📈 개발 로드맵

### ✅ Phase 1: 기획 및 설계 (완료)
- 전체 시스템 설계
- 데이터베이스 스키마 설계
- API 설계
- UI/UX 디자인

### 🔄 Phase 2: 백엔드 개발 (진행중)
Week 1-2: 프로젝트 설정 & 인증 시스템
- ✅ 프로젝트 초기화
- ✅ Prisma 스키마 완성
- ✅ 설정 파일 작성
- ⏳ 패키지 설치
- ⏳ 데이터베이스 마이그레이션
- ⏳ 인증 API 구현

Week 3-4: 문제 은행 시스템
- ⏳ 문제 CRUD API
- ⏳ 검색 & 필터링
- ⏳ 파일 업로드

Week 5-7: 평가 시스템
- ⏳ 평가 API
- ⏳ 적응형 엔진
- ⏳ 채점 시스템

Week 8-9: 학습 분석
- ⏳ 진행도 추적
- ⏳ 통계 & 리포트

Week 10: 통합 & 최적화
- ⏳ 테스트
- ⏳ 성능 최적화
- ⏳ 문서화

### ⏳ Phase 3: 프론트엔드 개발 (예정)
Week 11-15: 학생 인터페이스
Week 16-18: 교사 인터페이스
Week 19-20: 통합 & 배포

## 📞 다음 단계

### 즉시 실행 가능한 작업

1. **패키지 설치**
   ```bash
   cd backend
   npm install
   ```

2. **환경 변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 열어 DATABASE_URL 등 설정
   ```

3. **데이터베이스 설정**
   ```bash
   # PostgreSQL 데이터베이스 생성
   createdb literacy_assessment

   # Prisma 마이그레이션
   npm run prisma:migrate
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

### 개발 우선순위

1. ✅ **백엔드 기반 구축** (완료)
2. 🔄 **인증 시스템** (다음 단계)
3. ⏳ 문제 은행 시스템
4. ⏳ 평가 시스템
5. ⏳ 프론트엔드 개발

## 🤝 팀

- **Project Lead**: [이름]
- **Backend Developer**: [이름]
- **Frontend Developer**: [이름]
- **UI/UX Designer**: [이름]

## 📄 라이선스

MIT License

## 📧 문의

프로젝트 관련 문의: [이메일]
