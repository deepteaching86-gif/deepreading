# Vercel Environment Variables Setup

## ⚠️ Critical Missing Configuration

The backend is currently failing because **environment variables are not configured in Vercel**.

## Error Symptoms

- Login endpoint returns: `500 Internal Server Error`
- Health endpoint works correctly
- Database connection failing due to missing `DATABASE_URL`

## Required Environment Variables

Add these to your Vercel project: https://vercel.com/dashboard → Select Project → Settings → Environment Variables

### Critical Variables (Required)

```bash
# Database
DATABASE_URL=postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025%21%40%23%24SecureDB@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase
SUPABASE_URL=https://sxnjeqqvqbhueqbwsnpj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bmplcXF2cWJodWVxYndzbnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODUxMjAsImV4cCI6MjA3NTA2MTEyMH0.6xGE1QVp4GNV2iGRRwrXEU4ZblJqcn_gNusVhK8RmXI

# JWT
JWT_SECRET=literacy-assessment-production-jwt-key-2025-super-secure
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=https://playful-cocada-a89755.netlify.app
```

### Standard Variables

```bash
# Server
NODE_ENV=production
API_VERSION=v1

# Security
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Files
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/tmp/uploads

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/tmp/logs

# Application
APP_NAME=Literacy Assessment System
APP_URL=https://literacy-assessment-backend.vercel.app
FRONTEND_URL=https://playful-cocada-a89755.netlify.app
AWS_REGION=ap-northeast-2
```

### Optional (Service Role)

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bmplcXF2cWJodWVxYndzbnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ4NTEyMCwiZXhwIjoyMDc1MDYxMTIwfQ.SBNG3wXzfT5ahxBJBD84x_FAUHghy4iYj4c5apyrjRI
```

## Setup Instructions

### Method 1: Manual (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project: `literacy-assessment-backend`
3. Go to **Settings** → **Environment Variables**
4. For each variable above:
   - Click **Add New**
   - Enter **Key** (e.g., `DATABASE_URL`)
   - Enter **Value** (copy from above)
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

### Method 2: Using Vercel CLI

```bash
# Login to Vercel
vercel login

# Navigate to backend directory
cd backend

# Add environment variables from .env.vercel file
bash scripts/setup-vercel-env.sh
```

### Method 3: Using Vercel API (Programmatic)

```bash
# Get your Vercel token from: https://vercel.com/account/tokens
export VERCEL_TOKEN=your_vercel_token_here

# Run the setup script
cd backend
npx ts-node scripts/add-vercel-env.ts
```

## After Adding Variables

1. **Redeploy the application:**
   ```bash
   vercel --prod
   ```
   Or use the Vercel Dashboard → Deployments → Redeploy

2. **Verify environment variables:**
   - Check Vercel Dashboard → Settings → Environment Variables
   - Should see all variables listed

3. **Test the deployment:**
   ```bash
   # Test health endpoint
   curl https://literacy-assessment-backend.vercel.app/health

   # Test login endpoint
   curl -X POST "https://literacy-assessment-backend.vercel.app/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@literacytest.com","password":"Admin123!@#"}'
   ```

4. **Expected successful login response:**
   ```json
   {
     "success": true,
     "message": "로그인 성공",
     "data": {
       "user": {
         "id": 1,
         "email": "admin@literacytest.com",
         "name": "Admin",
         "role": "admin"
       },
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     }
   }
   ```

## Troubleshooting

### Still getting 500 errors after adding variables?

1. **Check Vercel logs:**
   ```bash
   vercel logs --follow
   ```

2. **Verify DATABASE_URL format:**
   - Must include URL-encoded password
   - Special characters: `!` = `%21`, `@` = `%40`, `#` = `%23`, `$` = `%24`

3. **Check environment variable scope:**
   - Ensure variables are added to **Production** environment
   - Redeploy after adding variables

4. **Verify Prisma Client generation:**
   - Check build logs for `prisma generate` command
   - Ensure `package.json` has correct build script

### Database connection issues?

1. **Test Supabase connection:**
   - Go to Supabase Dashboard
   - Check database is running
   - Verify connection string

2. **Check connection pooler:**
   - Using `aws-1-ap-northeast-2.pooler.supabase.com` (Session Pooler)
   - Port: 6543
   - Parameter: `pgbouncer=true`

## Security Notes

- ⚠️ **Never commit `.env` files** to version control
- ⚠️ **Change JWT_SECRET** for production use
- ⚠️ **Rotate secrets** regularly
- ✅ Use Vercel's encrypted environment variables
- ✅ Review environment variable access in Settings
