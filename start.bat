@echo off
title iMovies - Movie Ticket Booking Made Simple
cd /d "%~dp0"

echo ========================================================
echo        Starting iMovies Cinema Booking Web App
echo ========================================================

set "PATH=%~dp0tools\node;%PATH%"

echo Starting Backend Server (Port 5000)...
start "iMovies Backend" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server (Port 5173)...
start "iMovies Frontend" cmd /k "cd /d "%~dp0frontend" && node node_modules\vite\bin\vite.js --host --port 5173"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173...
start http://localhost:5173

echo ========================================================
echo App is now running! Keep the terminal windows open.
echo URL: http://localhost:5173
echo ========================================================
pause
