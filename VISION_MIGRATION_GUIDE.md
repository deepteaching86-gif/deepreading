# Vision TEST Database Migration Guide

## Problem

Vision session fails to start with error:
```json
{
  "error": "Database error occurred"
}
```

**Root Cause**: The `vision_test_sessions` table has `updated_at TIMESTAMP(3) NOT NULL` without a `DEFAULT` value, causing INSERT failures.

## Solution

Run the **FIXED migration SQL** that includes:
1. `DEFAULT CURRENT_TIMESTAMP` for `updated_at` column
2. Database trigger to auto-update `updated_at` on record changes

## Deployment Steps

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select project: `sxnjeqqvqbhueqbwsnpj`

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in left sidebar
2. Click **"New query"** button

### Step 3: Use FIXED Migration

⚠️ **IMPORTANT**: Use the **FIXED version** (not migration-safe.sql):
```
backend/prisma/migrations/20250614_add_vision_test_models/migration-fixed.sql
```

This version includes:
- ✅ `DEFAULT CURRENT_TIMESTAMP` for `updated_at` column
- ✅ Auto-update trigger for `updated_at`
- ✅ Safe `IF NOT EXISTS` checks
- ✅ Won't fail if tables already exist

### Step 4: Run Fixed Migration SQL
1. Open file: `backend/prisma/migrations/20250614_add_vision_test_models/migration-fixed.sql`
2. Copy **entire contents** of the file
3. Paste into SQL Editor
4. Click **"Run"** button (or press `Ctrl + Enter`)
5. Wait for success message: `✅ Vision TEST tables migration completed successfully`

### Step 5: Verify Tables Created
Run this query in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'vision%'
ORDER BY table_name;
```

**Expected Result** (5 tables):
```
vision_calibration_adjustments
vision_calibrations
vision_gaze_data
vision_metrics
vision_test_sessions
```

### Step 6: Verify Trigger Created
Run this query:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'vision_test_sessions_updated_at_trigger';
```

**Expected Result**: 1 row showing the trigger on `vision_test_sessions`

### Step 7: No Backend Restart Needed
The migration is applied directly to the database. No backend restart required.

## Verification

After migration completes:

1. **Test Vision Session**: Go to frontend Vision TEST page
2. **Complete Calibration**: Finish the calibration flow
3. **Start Test**: Click "Start Vision Test"
4. **Expected**: No more "Database error occurred" ❌
5. **Expected**: Session starts successfully with `visionSessionId` ✅

## Tables Created

1. **`vision_test_sessions`** - Vision session data (1:1 with test_sessions)
   - **FIXED**: `updated_at` now has `DEFAULT CURRENT_TIMESTAMP`
   - **FIXED**: Auto-update trigger added

2. **`vision_calibrations`** - Reusable calibration data (7-day validity)

3. **`vision_gaze_data`** - Raw gaze tracking data (large-scale)

4. **`vision_metrics`** - 15 calculated eye-tracking metrics

5. **`vision_calibration_adjustments`** - Manual calibration corrections

## Troubleshooting

**If tables already exist**: Migration will skip them safely (using `IF NOT EXISTS`).

**If trigger already exists**: Migration will drop and recreate it safely (using `DROP TRIGGER IF EXISTS`).
