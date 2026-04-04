@echo off
setlocal
chcp 65001 >nul
set "PYTHONIOENCODING=utf-8"
set "PYTHONUTF8=1"

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "BACKEND_PYTHON=%BACKEND_DIR%\venv\Scripts\python.exe"
set "NGROK_EXE=%ROOT%ngrok.exe"
set "NGROK_URL="

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

if not exist "%NGROK_EXE%" (
    echo ngrok not found: %NGROK_EXE%
    pause
    exit /b 1
)

echo Starting backend, frontend and ngrok...

start "Gulangyu Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; Set-Location '%BACKEND_DIR%'; & '%BACKEND_PYTHON%' -X utf8 '%BACKEND_DIR%\main.py'"
start "Gulangyu Frontend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%ROOT%'; npm run dev"

timeout /t 5 /nobreak >nul

start "Gulangyu ngrok" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%ROOT%'; & '%NGROK_EXE%' http 5173"
timeout /t 4 /nobreak >nul

for /f "usebackq delims=" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; $t=(Invoke-RestMethod 'http://127.0.0.1:4040/api/tunnels').tunnels ^| Where-Object { $_.public_url -like 'https://*' } ^| Select-Object -First 1 -ExpandProperty public_url; if ($t) { Set-Clipboard -Value $t; [Console]::WriteLine($t) }"`) do set "NGROK_URL=%%i"

start "" "http://localhost:5173"

echo.
echo Opened 3 windows:
echo 1. Backend
echo 2. Frontend
echo 3. ngrok
echo.
if defined NGROK_URL (
    echo HTTPS link copied to clipboard:
    echo %NGROK_URL%
) else (
    echo Could not copy the ngrok URL automatically.
    echo Please copy the HTTPS link from the ngrok window line that starts with Forwarding.
)
echo.
echo On phone, use the full https://...ngrok-free.dev link in the browser address bar.
echo The first open may show an ngrok warning page once, then continue to the site.
pause
