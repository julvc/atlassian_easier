@echo off
cd /d "%~dp0"
title Atlassian Easy Suite - Desktop

echo =======================================================================
echo   ATLASSIAN EASY SUITE - LANZADOR DE ESCRITORIO
echo   Directorio: %~dp0
echo =======================================================================
echo.

if exist "package.json" goto :check_node
echo [ERROR] No se encontro package.json en este directorio.
echo Asegurate de ejecutar el archivo dentro de la carpeta del proyecto.
echo.
pause
exit /b 1

:check_node
where node >nul 2>&1
if not errorlevel 1 goto :check_npm
echo [ERROR] Node.js no esta disponible en el PATH del sistema.
echo Por favor instala Node.js LTS desde https://nodejs.org/
echo.
pause
exit /b 1

:check_npm
where npm >nul 2>&1
if not errorlevel 1 goto :check_modules
echo [ERROR] npm no esta disponible en el PATH del sistema.
echo.
pause
exit /b 1

:check_modules
if exist "node_modules\vite" goto :start_app
echo [INFO] Primera ejecucion detectada. Instalando paquetes npm...
call npm install
if errorlevel 1 goto :install_error
echo.

:start_app
taskkill /F /IM electron.exe >nul 2>&1

echo [OK] Entorno verificado. Iniciando Vite y Electron...
echo.

call npm run dev
if errorlevel 1 goto :run_fallback
goto :end

:run_fallback
echo.
echo =======================================================================
echo [AVISO] npm run dev devolvio un error. Intentando con Vite local...
echo =======================================================================
echo.
if exist "node_modules\.bin\vite.cmd" (
    call "node_modules\.bin\vite.cmd"
)
goto :end

:install_error
echo.
echo [ERROR] Fallo la instalacion de paquetes npm.
goto :end

:end
echo.
echo =======================================================================
echo   Ventana de ejecucion finalizada.
echo =======================================================================
echo.
pause
