@echo off
title SONDA - Suite de Apoyo y Automatizacion Atlassian
echo =======================================================================
echo   SONDA - ATLASSIAN PIPELINE & GOVERNANCE SUITE (DESKTOP)
echo   Entorno Autonomo Local · CMMI v3.0
echo =======================================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no se encuentra en el PATH. Por favor instala Node.js LTS.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [INFO] Primera ejecucion detectada. Instalando dependencias necesarias...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
)

echo [INFO] Iniciando Suite de Automatizacion de Escritorio...
echo.
npm run dev

pause
