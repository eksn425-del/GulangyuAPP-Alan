@echo off
setlocal
chcp 65001 >nul
set "PYTHONIOENCODING=utf-8"
set "PYTHONUTF8=1"

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "BACKEND_PYTHON=%BACKEND_DIR%\venv\Scripts\python.exe"

if not exist "%BACKEND_DIR%\main.py" (
    echo Backend entry not found: %BACKEND_DIR%\main.py
    pause
    exit /b 1
)

if not exist "%BACKEND_PYTHON%" (
    echo Backend python not found: %BACKEND_PYTHON%
    pause
    exit /b 1
)

if not exist "%ROOT%package.json" (
    echo Frontend package.json not found: %ROOT%package.json
    pause
    exit /b 1
)

echo Starting backend and frontend...

start "Gulangyu Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; Set-Location '%BACKEND_DIR%'; & '%BACKEND_PYTHON%' -X utf8 '%BACKEND_DIR%\main.py'"
start "Gulangyu Frontend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%ROOT%'; npm run dev"

timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo Opened 2 windows:
echo 1. Backend
echo 2. Frontend
echo.
echo Browser will open http://localhost:5173
echo Use this script for normal local testing.
pause
