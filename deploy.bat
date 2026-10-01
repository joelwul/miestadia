@echo off
chcp 65001 >nul
echo ==========================================
echo   Actualizando Mi Estadia en GitHub...
echo ==========================================
echo.

REM Verificar que hay cambios
git status --porcelain
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo ejecutar git status. Verifica que Git este instalado.
    pause
    exit /b 1
)

REM Obtener fecha y hora
for /f "tokens=1-3 delims=/" %%a in ('date /t') do (set mydate=%%c%%b%%a)
for /f "tokens=1-2 delims=:." %%a in ('time /t') do (set mytime=%%a%%b)
set commit_msg="Auto-deploy %mydate% %mytime%"

echo [1/4] Agregando cambios...
git add .

echo [2/4] Verificando si hay cambios para commitear...
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo [INFO] No hay cambios nuevos para subir.
    pause
    exit /b 0
)

echo [3/4] Creando commit (%commit_msg%)...
git commit -m %commit_msg%

echo [4/4] Subiendo a GitHub (Vercel se actualiza solo)...
git push origin version-estable

echo.
echo ==========================================
echo   ¡Listo! Vercel esta publicando los cambios.
echo ==========================================
pause