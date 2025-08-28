# Script para iniciar Web Server de Open SWE con configuración optimizada
# Evita el error: JavaScript heap out of memory

Write-Host "=====================================" -ForegroundColor Magenta
Write-Host " Open SWE Web Server Launcher" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host ""

# Configurar memoria para Web server (4GB)
$env:NODE_OPTIONS="--max-old-space-size=4096"
Write-Host "[CONFIG] Memoria máxima configurada: 4GB" -ForegroundColor Green

# Configurar modo local
$env:OPEN_SWE_LOCAL_MODE="true"
Write-Host "[CONFIG] Modo local activado" -ForegroundColor Green

# Configurar clave de encriptación (usar la misma que el API)
$env:SECRETS_ENCRYPTION_KEY="8e46560b5c01570c2f7467a0acaa08b326a2dfa748e91d0d977249499904e6cb"
Write-Host "[CONFIG] Clave de encriptación sincronizada" -ForegroundColor Green

# Cambiar al directorio del Web
Write-Host "[INFO] Cambiando al directorio apps\web..." -ForegroundColor Cyan
cd apps\web

# Iniciar el servidor
Write-Host "[START] Iniciando Web Server en puerto 3000..." -ForegroundColor Green
Write-Host ""
Write-Host "Interfaz Web disponible en: http://localhost:3000" -ForegroundColor Magenta
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

# Ejecutar el servidor
node ..\..\yarn.js dev
