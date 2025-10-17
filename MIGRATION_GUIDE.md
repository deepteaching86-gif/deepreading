# Peer Statistics Migration Guide

## Overview
이 가이드는 또래 평균 통계 시스템을 데이터베이스에 설정하는 방법을 설명합니다.

## Method 1: 브라우저에서 직접 실행 (권장)

### Step 1: Admin으로 로그인
1. https://playful-cocada-a89755.netlify.app 접속
2. Admin 계정으로 로그인:
   - Email: `admin@deepreading.com`
   - Password: `Admin123!@#`

### Step 2: 브라우저 개발자 도구 열기
- Chrome/Edge: `F12` 또는 `Ctrl+Shift+I`
- Firefox: `F12`
- Safari: `Cmd+Option+I`

### Step 3: Console 탭으로 이동

### Step 4: 다음 코드를 Console에 붙여넣기

```javascript
// Get token from localStorage
const token = localStorage.getItem('accessToken');

if (!token) {
  console.error('❌ No access token found. Please login first.');
} else {
  console.log('🔐 Token found:', token.substring(0, 20) + '...');

  // Check status
  fetch('/.netlify/functions/api/v1/admin/migrate/peer-stats/status', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('📊 Current Status:', data);

    if (data.initialized && data.count > 0) {
      console.log('✅ Peer statistics already initialized!');
      console.log(`   Total records: ${data.count}`);
    } else {
      console.log('🚀 Running migration...');

      // Run migration
      return fetch('/.netlify/functions/api/v1/admin/migrate/peer-stats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(result => {
        console.log('✅ Migration completed!', result);
        console.log(`   Inserted: ${result.inserted || result.count} records`);
      });
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
}
```

### Step 5: Enter를 눌러 실행

### Step 6: 결과 확인
- "✅ Migration completed!" 메시지가 표시되면 성공
- 81개의 레코드가 생성되었는지 확인

## Method 2: Supabase SQL Editor (대안)

Netlify Functions가 작동하지 않는 경우:

### Step 1: Supabase Dashboard 접속
https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj

### Step 2: SQL Editor 열기
좌측 메뉴에서 "SQL Editor" 클릭

### Step 3: 테이블 생성
`backend/migrations/add-peer-statistics.sql` 파일 내용 복사 → 실행

### Step 4: 시드 데이터 삽입
`backend/migrations/seed-peer-statistics.sql` 파일 내용 복사 → 실행

### Step 5: 확인
```sql
SELECT COUNT(*) FROM peer_statistics;  -- 81개여야 함
```

## Verification

마이그레이션이 성공했는지 확인:

### 1. Console에서 확인
```javascript
const token = localStorage.getItem('accessToken');
fetch('/.netlify/functions/api/v1/admin/migrate/peer-stats/status', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('Status:', data));
```

### 2. 예상 결과
```json
{
  "success": true,
  "initialized": true,
  "count": 81,
  "sample": [
    {
      "category": "grammar",
      "avgScore": "67.21",
      "sampleSize": 100,
      "simulatedSampleSize": 100
    },
    // ... 4 more items
  ]
}
```

## Troubleshooting

### Error: "No access token found"
→ Admin으로 다시 로그인하세요

### Error: "401 Unauthorized"
→ 토큰이 만료되었습니다. 다시 로그인하세요

### Error: "Peer statistics already exist"
→ 이미 마이그레이션이 완료되었습니다. 성공!

### Error: Network error
→ Netlify 배포가 완료되었는지 확인하세요

## Next Steps

마이그레이션이 완료되면:
1. 학생이 시험을 완료
2. 채점 완료 후 `/report/:resultId` 페이지 접속
3. A4 레포트에서 또래 비교 그래프 확인

## Technical Details

- **Records**: 81개 (9 grades × 9 categories)
- **Sample Size**: 각 100명의 시뮬레이션 학생
- **Distribution**: Normal distribution (mean: grade-specific, stddev: 12)
- **Categories**: vocabulary, reading, grammar, reasoning, 독서동기/환경/습관/선호, 쓰기동기
- **Grades**: 1-9학년

시뮬레이션 데이터는 실제 학생 데이터가 누적될수록 가중 평균으로 업데이트됩니다.
