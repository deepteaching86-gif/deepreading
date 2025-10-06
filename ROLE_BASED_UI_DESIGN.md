# 역할별 UI/UX 설계 (Role-Based Dashboard Design)

## 📋 현재 시스템 분석

### 사용자 역할 (UserRole enum)
```typescript
enum UserRole {
  student  // 학생
  teacher  // 선생님 (현재는 teacher, admin과 유사한 역할)
  parent   // 학부모
  admin    // 시스템 관리자
}
```

### 현재 데이터베이스 관계
- **User**: 기본 사용자 정보 (email, role, name, phone)
- **Student**: 학생 정보 (userId, grade, schoolName, parentId, teacherId)
  - 학생 1명 → 학부모 1명 연결 가능 (parentId)
  - 학생 1명 → 선생님 1명 연결 가능 (teacherId)
- **TestSession**: 테스트 세션 (학생이 응시한 테스트)
- **TestResult**: 테스트 결과 (채점 완료 후)

---

## 🎯 역할별 대시보드 설계

### 1️⃣ **학생 (Student) 대시보드**

#### 주요 기능
- ✅ 테스트 응시하기
- ✅ 내 테스트 결과 조회
- ✅ 학습 진도 추적
- ✅ 개인 성적 분석

#### 화면 구성
```
┌─────────────────────────────────────────────┐
│  Header: 안녕하세요, [이름]님 (초등 3학년)     │
│  [내 정보] [로그아웃]                          │
├─────────────────────────────────────────────┤
│                                             │
│  📊 내 학습 현황                              │
│  ┌────────────────┬────────────────┐         │
│  │ 완료한 테스트   │ 평균 점수       │         │
│  │     5개        │    82.5%       │         │
│  └────────────────┴────────────────┘         │
│                                             │
│  🎯 내 학년 테스트                            │
│  ┌─────────────────────────────────┐         │
│  │ 초등 3학년 문해력 진단 평가         │         │
│  │ 30문항 · 40분                    │         │
│  │ [시작하기]                        │         │
│  └─────────────────────────────────┘         │
│                                             │
│  📝 최근 테스트 결과                          │
│  ┌─────────────────────────────────┐         │
│  │ 초3-V1 | 85% | 2등급 | 2024-01-15 │         │
│  │ [상세보기]                        │         │
│  └─────────────────────────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

#### API 엔드포인트 (필요)
- `GET /api/v1/students/me/profile` - 학생 프로필 조회
- `GET /api/v1/students/me/stats` - 학생 통계 요약
- `GET /api/v1/templates?grade={grade}` - 학년별 템플릿 조회
- `GET /api/v1/sessions/my` - 내 테스트 세션 목록
- `GET /api/v1/results/my` - 내 테스트 결과 목록

---

### 2️⃣ **학부모 (Parent) 대시보드**

#### 주요 기능
- ✅ 자녀 선택/전환 (여러 자녀 가능)
- ✅ 자녀 성적 조회
- ✅ 성적 추이 그래프
- ✅ 학습 제안 사항 확인
- ✅ 자녀 비교 분석 (형제자매)

#### 화면 구성
```
┌─────────────────────────────────────────────┐
│  Header: 안녕하세요, [학부모 이름]님           │
│  [내 정보] [로그아웃]                          │
├─────────────────────────────────────────────┤
│                                             │
│  👨‍👩‍👧‍👦 자녀 선택                              │
│  ┌──────┬──────┬──────┐                     │
│  │ 김철수 │ 김영희 │ + 추가 │                  │
│  │(초3)  │(중1)  │      │                  │
│  └──────┴──────┴──────┘                     │
│                                             │
│  📊 김철수 학습 현황 (초등 3학년)               │
│  ┌────────────────────────────────┐         │
│  │ 최근 테스트: 85% (2등급)         │         │
│  │ 전국 상위: 15%                  │         │
│  │ 강점: 어휘력, 독해력             │         │
│  │ 약점: 추론/사고력               │         │
│  └────────────────────────────────┘         │
│                                             │
│  📈 성적 추이 (최근 6개월)                     │
│  ┌────────────────────────────────┐         │
│  │     [그래프]                    │         │
│  │  90%                           │         │
│  │  85% ●───●───●                 │         │
│  │  80%                           │         │
│  │  75%                           │         │
│  └────────────────────────────────┘         │
│                                             │
│  📚 학습 제안 사항                            │
│  ┌────────────────────────────────┐         │
│  │ • 추론 문제 집중 학습 필요        │         │
│  │ • 하루 20분 독서 권장            │         │
│  │ • 논리적 사고 훈련 추천          │         │
│  └────────────────────────────────┘         │
│                                             │
│  🔄 형제 비교 (김철수 vs 김영희)               │
│  ┌────────────────────────────────┐         │
│  │ 어휘력: 85% vs 78%              │         │
│  │ 독해력: 82% vs 88%              │         │
│  └────────────────────────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

#### API 엔드포인트 (필요)
- `GET /api/v1/parents/me/children` - 내 자녀 목록 조회
- `GET /api/v1/students/{studentId}/stats` - 특정 자녀 통계
- `GET /api/v1/students/{studentId}/sessions` - 자녀 테스트 세션 목록
- `GET /api/v1/students/{studentId}/results` - 자녀 테스트 결과 목록
- `GET /api/v1/students/{studentId}/trends` - 자녀 성적 추이
- `GET /api/v1/students/{studentId}/recommendations` - 자녀 학습 제안
- `POST /api/v1/parents/me/add-child` - 자녀 추가 (초대 코드 입력)

---

### 3️⃣ **관리자 (Admin) 대시보드**

#### 주요 기능
- ✅ 전체 시스템 통계
- ✅ 사용자 관리 (학생, 학부모, 선생님)
- ✅ 테스트 템플릿 관리
- ✅ 문항 관리
- ✅ 성적 통계 분석
- ✅ 학년별/학교별 집계
- ✅ 데이터 시딩 (개발용)

#### 화면 구성
```
┌─────────────────────────────────────────────┐
│  Header: 관리자 대시보드                       │
│  [문항관리] [사용자관리] [통계] [설정] [로그아웃] │
├─────────────────────────────────────────────┤
│                                             │
│  📊 시스템 통계 (오늘)                         │
│  ┌──────┬──────┬──────┬──────┐              │
│  │ 총 사용자│ 활성 세션│ 완료 테스트│ 평균 점수 │  │
│  │  1,234 │   45   │    289   │  78.5% │  │
│  └──────┴──────┴──────┴──────┘              │
│                                             │
│  👥 최근 가입 사용자                           │
│  ┌─────────────────────────────────┐         │
│  │ 김철수 (학생, 초3) - 2024-01-20   │         │
│  │ 이영희 (학부모) - 2024-01-20      │         │
│  │ [더보기]                         │         │
│  └─────────────────────────────────┘         │
│                                             │
│  📝 문항 관리                                 │
│  ┌─────────────────────────────────┐         │
│  │ 학년별 템플릿: 9개 (초1~중3)       │         │
│  │ [문항 추가] [템플릿 편집]          │         │
│  └─────────────────────────────────┘         │
│                                             │
│  📈 학년별 성적 분포                           │
│  ┌─────────────────────────────────┐         │
│  │ 초등 1학년: 평균 82.3%            │         │
│  │ 초등 2학년: 평균 78.1%            │         │
│  │ ... [전체보기]                    │         │
│  └─────────────────────────────────┘         │
│                                             │
│  🔧 관리 작업                                 │
│  ┌─────────────────────────────────┐         │
│  │ [데이터베이스 시딩]                │         │
│  │ [통계 캐시 갱신]                  │         │
│  │ [오래된 세션 정리]                │         │
│  └─────────────────────────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

#### API 엔드포인트 (필요)
- `GET /api/v1/admin/stats/overview` - 전체 시스템 통계
- `GET /api/v1/admin/users` - 사용자 목록 (필터: role, 검색)
- `POST /api/v1/admin/users` - 사용자 생성
- `PATCH /api/v1/admin/users/{id}` - 사용자 수정
- `DELETE /api/v1/admin/users/{id}` - 사용자 삭제
- `GET /api/v1/admin/templates` - 템플릿 관리
- `GET /api/v1/admin/stats/by-grade` - 학년별 통계
- `GET /api/v1/admin/stats/by-school` - 학교별 통계
- `POST /api/v1/admin/seed/run` - 데이터베이스 시딩 (기존)
- `POST /api/v1/admin/cache/refresh` - 통계 캐시 갱신

---

### 4️⃣ **선생님 (Teacher) 대시보드** *(선택적)*

> **Note**: 현재 `teacher` 역할은 있지만 별도 UI가 없습니다. Admin과 유사하거나, 담당 학생들만 관리하는 제한된 admin 역할로 구현 가능.

#### 주요 기능
- ✅ 담당 학생 목록 조회
- ✅ 담당 학생 성적 조회
- ✅ 학급 평균 통계
- ✅ 학생별 학습 제안 생성

#### 화면 구성
```
┌─────────────────────────────────────────────┐
│  Header: [선생님 이름]님의 학급 관리            │
│  [담당 학생] [성적 분석] [로그아웃]             │
├─────────────────────────────────────────────┤
│                                             │
│  👨‍🏫 담당 학급: 초등 3학년 1반                  │
│  ┌────────────────────────────────┐         │
│  │ 총 학생: 25명                   │         │
│  │ 테스트 완료: 20명 (80%)          │         │
│  │ 학급 평균: 78.3%                │         │
│  └────────────────────────────────┘         │
│                                             │
│  📊 학생 목록 및 성적                          │
│  ┌─────────────────────────────────┐         │
│  │ 김철수 | 85% | 2등급 | ✅ 완료     │         │
│  │ 이영희 | 92% | 1등급 | ✅ 완료     │         │
│  │ 박민수 | - | - | ⏳ 미응시        │         │
│  │ [전체보기]                       │         │
│  └─────────────────────────────────┘         │
│                                             │
│  📈 학급 성적 분포                             │
│  ┌─────────────────────────────────┐         │
│  │ [막대 그래프]                    │         │
│  │ 1등급: 5명, 2등급: 8명, ...      │         │
│  └─────────────────────────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

#### API 엔드포인트 (필요)
- `GET /api/v1/teachers/me/students` - 담당 학생 목록
- `GET /api/v1/teachers/me/stats` - 학급 통계
- `GET /api/v1/students/{studentId}/sessions` - 학생 세션 (teacher 권한)
- `GET /api/v1/students/{studentId}/results` - 학생 결과 (teacher 권한)

---

## 🛣️ 라우팅 구조 (Role-Based Routing)

### 공통 라우트
```
/login           - 로그인
/register        - 회원가입
/forgot-password - 비밀번호 찾기
```

### 학생 전용 라우트
```
/dashboard                - 학생 대시보드 (메인)
/test/start/:templateCode - 테스트 시작
/test/session/:sessionId  - 테스트 응시 중
/test/result/:sessionId   - 테스트 결과 조회
/profile                  - 내 프로필
```

### 학부모 전용 라우트
```
/parent/dashboard              - 학부모 대시보드 (메인)
/parent/children               - 자녀 관리
/parent/child/:studentId       - 특정 자녀 상세
/parent/child/:studentId/results - 자녀 성적 목록
/parent/add-child              - 자녀 추가
```

### 관리자 전용 라우트
```
/admin/dashboard         - 관리자 대시보드 (메인)
/admin/users             - 사용자 관리
/admin/students          - 학생 관리
/admin/templates         - 템플릿 관리
/admin/questions         - 문항 관리 (기존)
/admin/statistics        - 통계 분석
/admin/settings          - 시스템 설정
```

### 선생님 전용 라우트 *(선택적)*
```
/teacher/dashboard       - 선생님 대시보드 (메인)
/teacher/students        - 담당 학생 목록
/teacher/class-stats     - 학급 통계
/teacher/student/:id     - 학생 상세
```

---

## 🔐 접근 제어 (Access Control)

### 라우트 가드 (Route Guard)
```typescript
// 예시: ProtectedRoute 컴포넌트
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}
```

### 라우트 설정 예시
```typescript
<Route path="/admin/*" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminLayout />
  </ProtectedRoute>
} />

<Route path="/parent/*" element={
  <ProtectedRoute allowedRoles={['parent']}>
    <ParentLayout />
  </ProtectedRoute>
} />

<Route path="/dashboard" element={
  <ProtectedRoute allowedRoles={['student']}>
    <StudentDashboard />
  </ProtectedRoute>
} />
```

---

## 📱 반응형 디자인 고려사항

### 모바일 우선 (Mobile-First)
- 학생: 주로 태블릿/모바일 사용 예상
- 학부모: 모바일/데스크톱 혼합
- 관리자: 주로 데스크톱 사용

### 브레이크포인트
```css
sm: 640px  /* 모바일 */
md: 768px  /* 태블릿 */
lg: 1024px /* 데스크톱 */
xl: 1280px /* 대형 데스크톱 */
```

---

## 🎨 UI 컴포넌트 재사용

### 공통 컴포넌트
- `Header` - 역할별 헤더 (props로 role 전달)
- `StatsCard` - 통계 카드
- `SessionList` - 테스트 세션 목록
- `GradeChart` - 성적 차트
- `StudentCard` - 학생 정보 카드

### 역할별 레이아웃
- `StudentLayout` - 학생용 레이아웃
- `ParentLayout` - 학부모용 레이아웃
- `AdminLayout` - 관리자용 레이아웃
- `TeacherLayout` - 선생님용 레이아웃

---

## 🚀 구현 우선순위

### Phase 1 (필수)
1. ✅ 학생 대시보드 개선
2. ✅ 학부모 대시보드 구현
3. ✅ 관리자 대시보드 개선
4. ✅ 역할별 라우팅 및 접근 제어

### Phase 2 (선택)
1. 선생님 대시보드 구현
2. 통계 차트 및 그래프
3. 학습 제안 AI 기능
4. 형제 비교 분석

### Phase 3 (향후)
1. 실시간 알림 시스템
2. 모바일 앱 개발
3. 다국어 지원
4. 고급 분석 리포트

---

## 📊 데이터 흐름 (Data Flow)

### 학생 로그인 후
```
Login → JWT Token 발급 → User 정보 조회 → Student 정보 조회 → Dashboard 렌더링
```

### 학부모 로그인 후
```
Login → JWT Token 발급 → User 정보 조회 → 자녀 목록 조회 → 첫 번째 자녀 선택 → Dashboard 렌더링
```

### 관리자 로그인 후
```
Login → JWT Token 발급 → User 정보 조회 → 시스템 통계 조회 → Admin Dashboard 렌더링
```

---

## 🔄 상태 관리 (State Management)

### Zustand Store 구조
```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  student: Student | null; // 학생인 경우
  children: Student[]; // 학부모인 경우
  selectedChildId: string | null; // 학부모가 선택한 자녀
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  selectChild: (childId: string) => void;
}
```

---

## 📝 추가 고려사항

### 보안
- JWT 토큰 만료 처리
- Refresh Token 관리
- CSRF 보호
- XSS 보호

### 성능
- 통계 데이터 캐싱
- 무한 스크롤 (목록이 긴 경우)
- 이미지 최적화
- 번들 크기 최적화

### 접근성
- ARIA 레이블
- 키보드 네비게이션
- 스크린 리더 지원
- 고대비 모드

---

## ✅ 다음 단계

1. **Backend API 구현** - 역할별 엔드포인트 추가
2. **Frontend 라우팅** - 역할별 라우트 가드 구현
3. **대시보드 컴포넌트** - 역할별 대시보드 UI 개발
4. **권한 검증** - 미들웨어 및 가드 테스트
5. **데이터 연동** - API 연동 및 테스트
