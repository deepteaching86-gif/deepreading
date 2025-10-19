# 🚨 Quick Fix - Run This Now to Fix Vision TEST Error

## Problem
```
Error: "Database error occurred"
```

Vision tables don't exist in database with correct schema.

---

## ✅ Solution (2 minutes)

### Step 1: Open Supabase SQL Editor

Click this link: **[Open Supabase SQL Editor](https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/sql/new)**

### Step 2: Copy Migration SQL

Open this file on your computer:
```
backend/prisma/migrations/20250614_add_vision_test_models/migration-fixed.sql
```

**Or download it from GitHub**: https://github.com/deepteaching86-gif/deepreading/blob/main/backend/prisma/migrations/20250614_add_vision_test_models/migration-fixed.sql

### Step 3: Paste and Run

1. **Copy entire contents** of `migration-fixed.sql`
2. **Paste** into Supabase SQL Editor
3. Click **"RUN"** button (bottom-right)
4. Wait for success messages:
   ```
   ✅ Vision TEST tables migration completed successfully
   ✅ Trigger for updated_at auto-update created
   ```

### Step 4: Verify Tables Created

Run this query in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'vision%'
ORDER BY table_name;
```

**Expected**: 5 tables
- ✅ `vision_calibration_adjustments`
- ✅ `vision_calibrations`
- ✅ `vision_gaze_data`
- ✅ `vision_metrics`
- ✅ `vision_test_sessions`

---

## 🎉 Done!

Now refresh the Vision TEST page and try again. The "Database error occurred" should be gone!

---

## Still Getting Errors?

If you still see errors after running the migration, share:
1. The SQL Editor output/errors
2. The console error from Vision TEST page

---

## Alternative: Use Windows Script (requires PostgreSQL client)

If you have PostgreSQL client tools installed, run:
```cmd
run-vision-migration.bat
```

This will automatically connect to Supabase and run the migration.
