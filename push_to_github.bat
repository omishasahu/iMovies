@echo off
title Push iMovies to GitHub
cd /d "%~dp0"

set "PATH=%~dp0tools\git\cmd;%PATH%"

echo ========================================================
echo           Pushing iMovies Project to GitHub
echo ========================================================

echo Current Git Status:
git status

echo.
echo Pushing commits to https://github.com/omishasahu/iMovies.git...
git push -u origin main

echo.
echo ========================================================
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Project successfully pushed to GitHub!
) else (
    echo [NOTE] If prompted, please sign in to GitHub in the popup window.
)
echo ========================================================
pause
