# Script para iniciar API Server de Open SWE con configuración optimizada
# Evita el error: JavaScript heap out of memory

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Open SWE API Server Launcher" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configurar memoria para API server (8GB)
$env:NODE_OPTIONS="--max-old-space-size=8192"
Write-Host "[CONFIG] Memoria máxima configurada: 8GB" -ForegroundColor Green

# Verificar si WSL2 está disponible
Write-Host "[CHECK] Verificando WSL2..." -ForegroundColor Yellow
$wslStatus = wsl --status 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] WSL2 está disponible" -ForegroundColor Green
} else {
    Write-Host "[WARN] WSL2 no está disponible - algunos comandos podrían fallar" -ForegroundColor Yellow
}

# Configurar modo local
$env:OPEN_SWE_LOCAL_MODE="true"
Write-Host "[CONFIG] Modo local activado" -ForegroundColor Green

# Cambiar al directorio del API
Write-Host "[INFO] Cambiando al directorio apps\open-swe..." -ForegroundColor Cyan
cd apps\open-swe

# Iniciar el servidor
Write-Host "[START] Iniciando API Server en puerto 2024..." -ForegroundColor Green
Write-Host ""
Write-Host "API Server disponible en: http://localhost:2024" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

# Ejecutar el servidor
node ..\..\yarn.js dev
