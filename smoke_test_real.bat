@echo off
setlocal
cd /d "C:\Users\jvarasc\Documents\CODIGO\COTIZADOR_CLAUDE_CORPORATIVE"
title Smoke Test Real Atlassian - Cotizador Claude Corporativo
echo =======================================================================
echo   ATLASSIAN EASIER - SMOKE TEST REAL DE ENTREGA (CMMI v3.0)
echo   Proyecto Base: Cotizador Claude Corporativo (CCYACE)
echo   Ruta: %CD%
echo   Objetivo: Actualizar JIRA, Bitbucket y Confluence (SIN CREAR .EXE)
echo =======================================================================
echo.

if not exist ".env.atlassian" (
    echo [ERROR] No se encontro el archivo .env.atlassian en el proyecto.
    pause
    exit /b 1
)

echo [1/3] Sincronizando Commits Estructurados CMMI...
call node scripts\crear_commits_cmmi.cjs

echo.
echo [2/3] Sincronizando con Bitbucket Cloud (Tag, Rama y Commits)...
call node scripts\bitbucket_sync.cjs
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Fallo en la conexion o push a Bitbucket.
    pause
    exit /b 1
)

echo.
echo [3/3] Sincronizando con Jira Cloud y Confluence (Tablero 6013)...
call node scripts\atlassian_sync.cjs
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Fallo en la actualizacion de Jira / Confluence.
    pause
    exit /b 1
)

echo.
echo =======================================================================
echo   [EXITO] SMOKE TEST REAL COMPLETADO EXITOSAMENTE
echo =======================================================================
echo - JIRA: Tablero 6013 actualizado con tareas, estados y worklogs
echo - BITBUCKET: Repositorio sondacode/cotizador-claude-corporativo al dia
echo - CONFLUENCE: Validacion y documentacion CMMI v3.0 completada
echo - COMPILACION: Omitida exitosamente para agilizar el proceso
echo =======================================================================
echo.
pause
