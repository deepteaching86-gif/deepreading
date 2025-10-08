# Render 데이터베이스 마이그레이션 실행 방법

## 문제
`students.parent_phone` 컬럼이 데이터베이스에 없어서 학생 로그인 시 500 에러 발생

## 해결 방법

### 옵션 1: Render Shell에서 직접 실행

1. Render 대시보드 → `literacy-backend` 서비스 선택
2. 상단 메뉴에서 `Shell` 클릭
3. 다음 명령어 실행:

```bash
cd /opt/render/project/src/backend
npx prisma migrate deploy
```

또는 수동 SQL 실행:

```bash
cd /opt/render/project/src/backend
npx ts-node scripts/run-migration.ts
```

### 옵션 2: Supabase에서 직접 SQL 실행

1. Supabase 대시보드 → SQL Editor
2. 다음 SQL 실행:

```sql
-- Add parent_phone column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20);

-- Add comment
COMMENT ON COLUMN students.parent_phone IS 'Parent contact phone number';
```

### 옵션 3: 환경변수로 자동 마이그레이션 설정

Render 서비스 설정에서:
1. Environment → Add Environment Variable
2. Key: `DATABASE_URL`
3. Value: (Supabase connection string)
4. Build Command 변경:
   ```
   npm install && npm run build && npx prisma migrate deploy
   ```

## 확인 방법

마이그레이션 후 학생 계정으로 로그인하여 대시보드가 정상적으로 로드되는지 확인
