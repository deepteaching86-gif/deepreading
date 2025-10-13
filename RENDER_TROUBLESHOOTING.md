# Render Deployment Troubleshooting Guide

## Current Issue: Migration Hanging on Startup

### Problem
Render deployment is stuck in retry loop with old configuration that includes `npx prisma migrate deploy`, which hangs indefinitely on pooled connection.

### Symptoms
- Logs show: "No open ports detected, continuing to scan..."
- Process runs for 5+ minutes then times out
- Multiple retry attempts with same old command
- Server never starts

---

## SOLUTION: Manual Steps Required

### Step 1: Cancel All Running Deployments
1. Go to Render Dashboard: https://dashboard.render.com
2. Navigate to: **literacy-backend** service
3. Click on **"Events"** tab
4. Find all **"Deploying..."** or **"In Progress"** deployments
5. Click **"Cancel Deploy"** on each one
6. Wait until all deployments are cancelled

### Step 2: Clear Build Cache (Optional but Recommended)
1. In Render Dashboard, go to **literacy-backend** service
2. Click **"Settings"** tab
3. Scroll down to **"Build & Deploy"** section
4. Click **"Clear build cache & deploy"** button
5. This forces a fresh build without cached files

### Step 3: Manual Deploy with Latest Commit
1. After cancelling all deployments, Render should auto-trigger a new deploy
2. If not, click **"Manual Deploy"** button
3. Select branch: **main**
4. Click **"Deploy"**

### Step 4: Monitor Deployment Logs
Watch for these success indicators:

**✅ Correct Build Command** (should see):
```
==> Running build command 'cd backend && npm install && npx prisma generate && npm run build'
```

**✅ Correct Start Command** (should see):
```
==> Running 'cd backend && node dist/server.js'
```

**❌ WRONG Start Command** (if you see this, deployment is using old config):
```
==> Running 'cd backend && npx prisma migrate deploy && node dist/server.js'
```

**✅ Server Start Success** (should see):
```
✅ Database connected successfully
🚀 Server running on port 10000
📦 Environment: production
🌐 API URL: https://literacy-backend.onrender.com/api/v1
==> Your service is live 🎉
```

---

## Verification Steps

### After Successful Deployment

1. **Check Service Health**:
   ```bash
   curl https://literacy-backend.onrender.com/api/v1/health
   ```
   Expected response: `{"status":"ok","timestamp":"..."}`

2. **Check CORS Configuration**:
   ```bash
   curl -I https://literacy-backend.onrender.com/api/v1/health
   ```
   Should include CORS headers for frontend domain

3. **Test Authentication Endpoint**:
   ```bash
   curl -X POST https://literacy-backend.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

---

## Alternative: Deploy from Render Dashboard

If auto-deploy keeps failing:

1. **Disable Auto-Deploy**:
   - Settings > Build & Deploy
   - Toggle OFF "Auto-Deploy"

2. **Manual Deploy**:
   - Click "Manual Deploy"
   - Select "main" branch
   - Wait for build to complete

3. **Re-enable Auto-Deploy** (after successful deploy):
   - Settings > Build & Deploy
   - Toggle ON "Auto-Deploy"

---

## Expected Configuration (render.yaml)

```yaml
services:
  - type: web
    name: literacy-backend
    runtime: node
    plan: free
    region: singapore
    buildCommand: cd backend && npm install && npx prisma generate && npm run build
    startCommand: cd backend && node dist/server.js
    # NO migration command in startCommand - migrations run manually
```

---

## Database Migration Workflow

### Current Status
- ✅ Database schema is up-to-date (Vision TEST models already created)
- ✅ Migrations applied via local environment to Supabase
- ✅ Server uses pooled connection for queries (no DDL operations)

### Future Schema Changes

When you need to apply new migrations:

1. **Local Development**:
   ```bash
   cd backend

   # Update schema.prisma with changes
   # Then create migration
   npx prisma migrate dev --name your_migration_name
   ```

2. **Apply to Production Database**:
   ```bash
   # Use direct connection (not pooled)
   set DATABASE_URL=postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025!@#$SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres

   npx prisma migrate deploy
   ```

3. **Deploy to Render**:
   ```bash
   git add .
   git commit -m "feat: Your feature with schema changes"
   git push origin main
   ```

4. Render will automatically redeploy with new Prisma client

---

## Common Issues & Solutions

### Issue 1: "No open ports detected"
**Cause**: Server didn't start (migration hung or other error)
**Solution**:
- Check startCommand doesn't include `npx prisma migrate deploy`
- Verify server.js is binding to `process.env.PORT || 10000`
- Check for startup errors in logs

### Issue 2: "Can't reach database server"
**Cause**: Using wrong DATABASE_URL or direct connection from Render
**Solution**:
- Verify DATABASE_URL uses pooled connection (port 6543)
- Remove directUrl from schema.prisma
- Don't use direct connection (port 5432) from Render

### Issue 3: "Environment variable not found: DIRECT_URL"
**Cause**: Prisma schema has `directUrl = env("DIRECT_URL")` line
**Solution**:
- Comment out or remove `directUrl` line in schema.prisma
- Commit and redeploy

### Issue 4: Old deployment keeps retrying
**Cause**: Render stuck in retry loop with old commit
**Solution**:
- Cancel all running deployments in dashboard
- Clear build cache
- Manual deploy with latest commit

### Issue 5: "Prisma Client validation failed"
**Cause**: Prisma client generated from old schema
**Solution**:
- Ensure `npx prisma generate` runs in buildCommand
- Clear build cache
- Redeploy

---

## Render Dashboard Quick Links

- **Service Dashboard**: https://dashboard.render.com/web/[your-service-id]
- **Logs**: Dashboard > literacy-backend > Logs
- **Events**: Dashboard > literacy-backend > Events
- **Settings**: Dashboard > literacy-backend > Settings
- **Environment**: Dashboard > literacy-backend > Environment

---

## Emergency Rollback

If deployment continues to fail:

1. **Rollback to previous working version**:
   ```bash
   # Find last working commit
   git log --oneline -10

   # Rollback (example)
   git revert HEAD~3..HEAD
   git push origin main
   ```

2. **Or deploy specific commit**:
   - Render Dashboard > Manual Deploy
   - Enter specific commit SHA
   - Click Deploy

---

## Contact & Support

**Render Support**:
- Dashboard: https://dashboard.render.com/support
- Docs: https://render.com/docs
- Community: https://community.render.com

**Project Repository**:
- GitHub: https://github.com/deepteaching86-gif/deepreading
- Latest commit: `926481c1` (2025-10-14)

---

**Last Updated**: 2025-10-14
**Current Issue**: Migration hanging on pooled connection
**Required Action**: Cancel deployments and manual deploy latest commit
