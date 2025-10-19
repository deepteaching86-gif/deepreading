@echo off
REM Vision TEST Migration Runner for Windows
REM Runs the fixed migration on Supabase database

echo ========================================
echo Vision TEST Database Migration
echo ========================================
echo.

REM Set database password
set PGPASSWORD=DeepReading2025!@#$SecureDB

REM Database connection string
set DB_URL=postgresql://postgres.sxnjeqqvqbhueqbwsnpj@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres

echo Running migration-fixed.sql on Supabase...
echo.

REM Run migration
psql "%DB_URL%" -f backend\prisma\migrations\20250614_add_vision_test_models\migration-fixed.sql

if %errorlevel% neq 0 (
    echo.
    echo ❌ Migration failed!
    echo.
    echo ERROR: psql command not found.
    echo.
    echo SOLUTION: Install PostgreSQL client tools
    echo 1. Download from: https://www.postgresql.org/download/windows/
    echo 2. OR use Supabase Dashboard SQL Editor instead
    echo    - Go to: https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj
    echo    - Click "SQL Editor"
    echo    - Copy contents of migration-fixed.sql
    echo    - Paste and click "Run"
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Migration completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Refresh the Vision TEST page
echo 2. Complete calibration
echo 3. Start Vision TEST (should work now!)
echo.
pause
