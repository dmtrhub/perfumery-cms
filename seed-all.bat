@echo off
REM Seed all microservices databases
REM This script runs seed data for all microservices in dependency order

echo.
echo ======================================
echo Starting Database Seeding Process
echo ======================================
echo.

REM Navigate to auth microservice and run seed
echo [1/9] Seeding Auth microservice...
cd /d "%~dp0infrastructure\microservices\auth-microservice"
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Auth seed failed
    exit /b 1
)
echo.

REM Seed User microservice (uses same auth seed since same DB)
echo [2/9] Seeding User microservice...
cd /d "%~dp0infrastructure\microservices\user-microservice"
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ User seed failed
    exit /b 1
)
echo.

REM Seed Production microservice
echo [3/9] Seeding Production microservice...
cd /d "%~dp0infrastructure\microservices\production-microservice"
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Production seed failed
    exit /b 1
)
echo.

REM Seed Processing microservice
echo [4/9] Seeding Processing microservice...
cd /d "%~dp0infrastructure\microservices\processing-microservice"
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Processing seed failed
    exit /b 1
)
echo.

REM Seed Storage microservice
echo [5/9] Seeding Storage microservice...
cd /d "%~dp0infrastructure\microservices\storage-microservice"
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Storage seed failed
    exit /b 1
)
echo.

REM Seed Sales microservice
echo [6/9] Seeding Sales microservice...
cd /d "%~dp0infrastructure\microservices\sales-microservice"
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Sales seed failed
    exit /b 1
)
echo.

REM Seed Analytics microservice
echo [7/9] Seeding Analytics microservice...
cd /d "%~dp0infrastructure\microservices\analytics-microservice"
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Analytics seed failed
    exit /b 1
)
echo.

REM Seed Performance microservice
echo [8/9] Seeding Performance microservice...
cd /d "%~dp0infrastructure\microservices\performance-microservice"
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Performance seed failed
    exit /b 1
)
echo.

REM Seed Audit microservice
echo [9/9] Seeding Audit microservice...
cd /d "%~dp0infrastructure\microservices\audit-microservice"
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Audit seed failed
    exit /b 1
)
echo.

echo ======================================
echo ✅ All seeds completed successfully!
echo ======================================
echo.
pause
