# Deployment Notes - Literacy Assessment System

## Database Migration Strategy

### Issue: Pooled Connection Limitations
- Supabase connection pooling (Supavisor/pgBouncer) doesn't support all Prisma migration operations
- `npx prisma migrate deploy` hangs indefinitely when run through pooled connection
- Direct connection to Supabase (`db.*.supabase.co:5432`) blocked from Render servers

### Solution: Manual Migration Approach

#### 1. Local Environment Migration
Run migrations from local development environment with direct database access:

```bash
cd backend

# Set direct connection URL
set DATABASE_URL=postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025!@#$SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres

# Apply pending migrations
npx prisma migrate deploy

# OR create new migration
npx prisma migrate dev --name your_migration_name
```

#### 2. Render Deployment
Render deployment **skips migrations** on startup to avoid hanging:
- **buildCommand**: `cd backend && npm install && npx prisma generate && npm run build`
- **startCommand**: `cd backend && node dist/server.js`

#### 3. Production Migration Workflow

**When schema changes are needed**:

1. **Develop locally**:
   ```bash
   # Update schema.prisma
   npx prisma migrate dev --name add_new_feature
   ```

2. **Test locally**: Verify migration works with local database

3. **Apply to production database**:
   ```bash
   # Use direct connection URL
   DATABASE_URL="postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025!@#$SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres" npx prisma migrate deploy
   ```

4. **Deploy to Render**:
   ```bash
   git add .
   git commit -m "feat: Add new feature with schema changes"
   git push origin main
   ```

5. **Render automatically deploys**: Server starts with updated Prisma client matching new schema

### Current Database State

**Last Migration Applied**: `20250614_add_vision_test_models`
- Vision TEST models (VisionTestSession, VisionGazeData, VisionMetrics, VisionCalibration, VisionCalibrationAdjustment)
- All tables created successfully in Supabase production database

**Schema Version**: v2.0 (as of 2025-10-14)
- User Management (User, Student, RefreshToken, AuditLog)
- Test System (TestTemplate, Question, TestSession, Answer, TestResult)
- Survey System (SurveyResponse)
- Statistics (Statistic, PeerStatistics)
- Vision TEST (5 new tables)

### Verification

**Check if migrations are up-to-date**:
```bash
# Via Supabase Dashboard SQL Editor
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;

# Via local Prisma CLI (requires direct connection)
npx prisma migrate status
```

**Verify table structure**:
```bash
# Via Supabase Dashboard
# Navigate to: Database > Tables
# Verify all 19 tables exist
```

### Troubleshooting

**If Render deployment hangs**:
- Check that `startCommand` does NOT include `npx prisma migrate deploy`
- Verify `buildCommand` includes `npx prisma generate`
- Ensure DATABASE_URL uses pooled connection (port 6543)

**If schema mismatch errors occur**:
- Run migrations locally to sync production database
- Regenerate Prisma client: `npx prisma generate`
- Redeploy to Render with updated code

**If new migration needed**:
- Create migration locally: `npx prisma migrate dev`
- Apply to production via direct connection
- Commit migration files and deploy

### Environment Variables

**Render (Production)**:
- `DATABASE_URL`: Pooled connection for app queries (port 6543)
  ```
  postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025!@#$SecureDB@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
  ```

**Local Development**:
- `DATABASE_URL`: Direct connection for migrations (port 5432)
  ```
  postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025!@#$SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres
  ```

### Security Notes

- Direct database password contains special characters: `DeepReading2025!@#$SecureDB`
- URL-encoded in connection strings: `DeepReading2025%21%40%23%24SecureDB`
- Store credentials in `.env` file (gitignored)
- Rotate credentials periodically via Supabase dashboard

### Future Improvements

**Consider implementing**:
1. **Supabase CLI integration**: Run migrations via Supabase CLI with proper authentication
2. **GitHub Actions workflow**: Automate migration deployment as CI/CD step
3. **Migration status endpoint**: Add API endpoint to check migration status
4. **Pre-deployment hooks**: Render doesn't support pre-deploy hooks, but could use GitHub Actions

### References

- [Prisma with Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connection-pooling)
- [Render Deployment Guide](https://render.com/docs/deploy-node-express-app)

---

**Last Updated**: 2025-10-14
**Migration Version**: 20250614_add_vision_test_models
**Schema Version**: v2.0
