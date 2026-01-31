@echo off
echo ========================================
echo   MarketAI Suite - GitHub Push Script
echo ========================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed!
    echo.
    echo Please install Git from: https://git-scm.com/download/win
    echo.
    echo After installing Git, run this script again.
    pause
    exit /b 1
)

echo Git is installed. Proceeding...
echo.

REM Initialize repository if not already initialized
if not exist .git (
    echo Initializing Git repository...
    git init
    echo.
)

REM Configure Git user (update with your email)
echo Configuring Git user...
git config user.name "Renu2735"
git config user.email "renu@example.com"
echo.

REM Add all files
echo Adding files to Git...
git add .
echo.

REM Show status
echo Current status:
git status
echo.

REM Commit
echo Committing files...
git commit -m "Initial commit: MarketAI Suite - AI-Powered Marketing Platform"
echo.

REM Add remote (if not already added)
git remote remove origin >nul 2>&1
echo Adding remote repository...
git remote add origin https://github.com/Renu2735/MARKETMIND.git
echo.

REM Set main branch
echo Setting main branch...
git branch -M main
echo.

REM Push to GitHub
echo Pushing to GitHub...
echo You may be prompted for GitHub credentials...
git push -u origin main
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo   SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    echo Repository: https://github.com/Renu2735/MARKETMIND
    echo.
) else (
    echo ========================================
    echo   PUSH FAILED!
    echo ========================================
    echo.
    echo Common issues:
    echo 1. GitHub authentication required
    echo 2. Repository doesn't exist
    echo 3. No push access
    echo.
    echo Please check the error message above.
)

pause
