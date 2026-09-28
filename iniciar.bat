@echo off
color 0A
title MI ESTADIA - Servidor de Desarrollo

cls
echo.
echo ========================================
echo   MI ESTADIA - Servidor de Desarrollo  
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] Verificando instalacion...
echo.

if not exist "node_modules\" (
    echo [!] Instalando dependencias por primera vez...
    echo.
    call npm install
    echo.
    if errorlevel 1 (
        echo [ERROR] Fallo la instalacion
        pause
        exit /b 1
    )
)

echo [OK] Todo listo
echo.
echo [INFO] Iniciando servidor...
echo.
echo URL: http://localhost:3000
echo.
echo Presiona Ctrl+C para detener
echo ========================================
echo.

call npm run dev