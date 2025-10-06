# Database Migration Guide - Peer Statistics

## Overview
이 마이그레이션은 또래 평균 통계 시스템을 추가합니다.

## Files
- `add-peer-statistics.sql`: PeerStatistics 테이블 생성
- `seed-peer-statistics.sql`: 시뮬레이션된 또래 평균 데이터 (81개 레코드)

## Supabase Dashboard에서 실행하기

### Step 1: 테이블 생성
1. Supabase Dashboard 접속: https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj
2. 좌측 메뉴에서 **SQL Editor** 클릭
3. **New Query** 클릭
4. `add-peer-statistics.sql` 파일 내용 복사해서 붙여넣기
5. **Run** 버튼 클릭

### Step 2: 시드 데이터 삽입
1. 같은 SQL Editor에서 **New Query** 클릭
2. `seed-peer-statistics.sql` 파일 내용 복사해서 붙여넣기
3. **Run** 버튼 클릭

### Step 3: 확인
다음 쿼리로 데이터가 제대로 들어갔는지 확인:

```sql
-- 총 레코드 수 확인 (81개여야 함)
SELECT COUNT(*) FROM peer_statistics;

-- 학년별 카테고리 분포 확인
SELECT grade, category, avg_score, sample_size
FROM peer_statistics
ORDER BY grade, category;

-- 특정 학년의 또래 평균 확인 (예: 5학년)
SELECT
    category,
    avg_score,
    std_deviation,
    percentile_distribution
FROM peer_statistics
WHERE grade = 5;
```

## What This Migration Does

### 1. Creates `peer_statistics` table
- `id`: UUID (Primary Key)
- `grade`: Integer (1-9학년)
- `category`: Text (QuestionCategory enum)
- `avg_score`: Decimal(5,2) - 평균 점수
- `avg_percentage`: Decimal(5,2) - 평균 백분율
- `std_deviation`: Decimal(5,2) - 표준편차
- `sample_size`: Integer - 총 샘플 수
- `simulated_sample_size`: Integer - 시뮬레이션 샘플 수
- `percentile_distribution`: JSONB - 백분위 분포
- `last_updated`: Timestamp
- `created_at`: Timestamp

### 2. Adds Indexes
- Unique index on (grade, category)
- Index on grade for faster queries

### 3. Adds Check Constraint
- Ensures only valid categories are stored

### 4. Seeds 81 Records
- 9 grades × 9 categories = 81 records
- Each with 100 simulated students
- Normal distribution based on grade difficulty

## Categories
1. **vocabulary** (어휘)
2. **reading** (독해)
3. **grammar** (문법)
4. **reasoning** (추론)
5. **reading_motivation** (독서 동기)
6. **writing_motivation** (쓰기 동기)
7. **reading_environment** (독서 환경)
8. **reading_habit** (독서 습관)
9. **reading_preference** (독서 선호)

## Grade Difficulty Baseline
- Grade 1: 85% (가장 쉬움)
- Grade 2: 82%
- Grade 3: 78%
- Grade 4: 75%
- Grade 5: 72%
- Grade 6: 70%
- Grade 7: 68% (중1)
- Grade 8: 66%
- Grade 9: 64% (중3, 가장 어려움)

## Category Modifiers
- vocabulary: 0 (기준)
- reading: -3
- grammar: -5
- reasoning: -7 (가장 어려움)
- 동기/환경/습관/선호: +10 (설문, 높은 점수)

## How Real Data Updates Work

실제 학생이 테스트를 완료하면:
1. `peer-statistics.service.ts`의 `updatePeerStatisticsFromResult()` 호출
2. 학생의 영역별 점수 계산
3. 가중 평균으로 또래 평균 업데이트:
   ```
   new_avg = (simulated_avg * simulated_count + real_score) / (total_count)
   ```
4. 시뮬레이션 데이터의 영향력은 실제 데이터가 쌓일수록 감소

## Rollback

테이블을 제거하려면:

```sql
DROP TABLE IF EXISTS peer_statistics;
```

## Notes
- 시뮬레이션 데이터는 정규분포(Box-Muller transform) 기반
- 표준편차: 12점
- 각 학년/카테고리당 100명의 가상 학생
- 실제 학생 데이터가 누적될수록 또래 평균이 현실을 반영
