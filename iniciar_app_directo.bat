@echo off
cd /d "%~dp0"
title Atlassian Easy Suite - Inicio Directo

echo =======================================================================
echo   ATLASSIAN EASY SUITE - INICIO DIRECTO CON VITE LOCAL
echo   Directorio: %~dp0
echo =======================================================================
echo.

if exist "node_modules\.bin\vite.cmd" goto :run_vite
echo [INFO] No se encontro vite local. Instalando paquetes npm...
call npm install
if errorlevel 1 goto :error

:run_vite
taskkill /F /IM electron.exe >nul 2>&1
echo Iniciando Vite y Electron directamente...
echo.
call "node_modules\.bin\vite.cmd"
goto :end

:error
echo [ERROR] No se pudo preparar el entorno de ejecucion.

:end
echo.
pause
