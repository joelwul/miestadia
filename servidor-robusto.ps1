# servidor-robusto.ps1 - Servidor con auto-restart

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MI ESTADIA - Servidor Robusto" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd C:\Users\joelw\miestadia

# Función para reiniciar automáticamente
function Start-Server {
    while ($true) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Iniciando servidor..." -ForegroundColor Yellow
        
        # Ejecutar npm run dev y capturar errores
        npm run dev
        
        # Si llega aquí, el servidor se cayó
        Write-Host ""
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ⚠️  El servidor se detuvo" -ForegroundColor Red
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Reiniciando en 3 segundos..." -ForegroundColor Yellow
        Write-Host ""
        
        Start-Sleep -Seconds 3
    }
}

# Iniciar
Start-Server