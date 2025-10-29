# Render Deployment Instructions - VST Implementation

## Current Status
✅ **Code Fix Completed**: Changed `skill_tags` → `skill_tag` in admin_routes.py (line 123)
✅ **Commits Pushed**: All fixes committed and pushed to GitHub main branch
❌ **Render Auto-Deploy Issue**: Render is not automatically deploying the latest code

## Recent Commits
```
ae941b85 - Force rebuild: Add version to admin routes v2.1.0
7d75f1c3 - Trigger Render deployment: skill_tag column fix
3cd991bc - Fix: Change skill_tags to skill_tag in admin routes
```

## Manual Deployment Steps

### Option 1: Trigger Manual Deploy from Render Dashboard (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find service: **literacy-english-test-backend** (Python/FastAPI)
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait ~3-4 minutes for build to complete
5. Test endpoint:
   ```bash
   curl -X POST https://literacy-english-test-backend.onrender.com/api/admin/english-test/cleanup-and-insert-clean-items -H "Content-Type: application/json" | python -m json.tool
   ```

### Option 2: Check Auto-Deploy Settings

1. Go to Render Dashboard → **literacy-english-test-backend** service
2. Navigate to **Settings** tab
3. Scroll to **"Build & Deploy"** section
4. Verify:
   - ✅ **Auto-Deploy** is enabled
   - ✅ **Branch** is set to `main`
   - ✅ **Build Command**: `cd backend && pip install -r requirements.txt`
   - ✅ **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Option 3: Reconnect GitHub Webhook

If auto-deploy is enabled but not working:

1. Go to Render Dashboard → Service Settings
2. Click **"Disconnect"** under GitHub connection
3. Click **"Reconnect"** and re-authorize
4. Trigger a manual deploy to test

## What the Fix Does

**File**: `backend/app/english_test/admin_routes.py`

**Line 123** (Before):
```python
skill_tags, difficulty, discrimination, guessing,
```

**Line 123** (After):
```python
skill_tag, difficulty, discrimination, guessing,
```

**Why**: Prisma schema defines the column as `skill_tag` (singular), not `skill_tags` (plural).

## Expected Result After Deployment

When the deployment succeeds, the cleanup API should return:

```json
{
  "steps": [
    {"step": "1_check_current", "old_items": X, "old_passages": X},
    {"step": "2_vst_migration", "status": "success"},
    {"step": "3_delete_old_data", "status": "success"},
    {"step": "4_load_data", "passages_count": 4, "items_count": 40, ...},
    {"step": "5_insert_passages", "count": 4},
    {"step": "6_insert_items", "count": 40},
    {"step": "7_verify_insert", "new_items": 40, "new_passages": 4}
  ],
  "summary": {
    "old_items": X,
    "new_items": 40,
    "old_passages": X,
    "new_passages": 4
  }
}
```

## Test Items Breakdown

- **Grammar**: 13 items
- **Vocabulary**: 17 items (VST with frequency bands + pseudowords)
  - Real words: 14 (across 7 frequency bands: 1k-14k)
  - Pseudowords: 3 (trelict, flumbinate, grelastic)
- **Reading**: 10 items + 4 passages

## Troubleshooting

### If deployment fails:
1. Check Render build logs for Python dependency errors
2. Verify DATABASE_URL environment variable is set correctly
3. Check if all required environment variables are present

### If API still returns skill_tags error:
1. Verify deployment actually completed (check Render dashboard)
2. Check service restart completed (health endpoint: `/health`)
3. Verify correct service URL (Python service, not Node.js service)

### If migration fails:
- Migration error "already exists" is OK - columns may already be created
- Check database directly via Supabase dashboard

## Service URLs

- **Python Service (Correct)**: https://literacy-english-test-backend.onrender.com
- **Node.js Service (Old)**: https://literacy-backend.onrender.com ⚠️ Wrong service!

## Contact

If manual deployment doesn't work, check:
1. Render service logs
2. GitHub webhook delivery status
3. Render account limits (Free tier restrictions)
