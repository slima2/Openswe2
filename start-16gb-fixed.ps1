# Open SWE - Inicio con 16GB heap (Version corregida)
# Script para Windows PowerShell sin emojis

Write-Host "=== OPEN SWE - CONFIGURACION 16GB ===" -ForegroundColor Green
Write-Host ""

# Configurar variables de entorno
Write-Host "Configurando variables de entorno..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=16384 --max-semi-space-size=512 --initial-old-space-size=2048 --expose-gc --optimize-for-size --trace-warnings --trace-gc"
$env:LG_REDACTING_SERDE = "true"
$env:LG_MEM_WATCHDOG = "true"
$env:LG_USE_WORKERS = "true"
$env:LG_STREAM_JSON = "true"
$env:LG_MAX_HEAP_SIZE = "16384"
$env:LG_LARGE_CODEBASE_MODE = "true"
$env:LG_DOCUMENT_CACHE_SIZE = "250"
$env:LG_STRING_LIMIT = "25"
$env:LG_MESSAGE_LIMIT = "35"

Write-Host ""
Write-Host "CONFIGURACION DE MEMORIA:" -ForegroundColor Yellow
Write-Host "  - Heap limite: 16GB (vs 4GB donde crasheaste)" -ForegroundColor White
Write-Host "  - Document Cache: 250MB (LRU bounded)" -ForegroundColor White
Write-Host "  - String limite: 25MB (truncamiento inteligente)" -ForegroundColor White
Write-Host "  - Message limite: 35MB (ventana deslizante)" -ForegroundColor White
Write-Host "  - Warning threshold: 11.2GB (70% del limite)" -ForegroundColor White
Write-Host "  - Critical threshold: 13.6GB (85% del limite)" -ForegroundColor White
Write-Host ""

Write-Host "OPTIMIZACIONES HABILITADAS:" -ForegroundColor Yellow
Write-Host "  - Redacting Serializer: ACTIVADO" -ForegroundColor Green
Write-Host "  - Memory Watchdog: ACTIVADO" -ForegroundColor Green
Write-Host "  - Workers Aislados: ACTIVADO" -ForegroundColor Green
Write-Host "  - Stream JSON: ACTIVADO" -ForegroundColor Green
Write-Host "  - Large Codebase Mode: ACTIVADO" -ForegroundColor Green
Write-Host ""

# Verificar si yarn local existe
if (Test-Path ".\yarn.js") {
    Write-Host "Usando yarn local encontrado..." -ForegroundColor Cyan
    $yarnCommand = "node .\yarn.js"
} elseif (Get-Command yarn -ErrorAction SilentlyContinue) {
    Write-Host "Usando yarn del sistema..." -ForegroundColor Cyan
    $yarnCommand = "yarn"
} else {
    Write-Host "Yarn no encontrado, usando npm..." -ForegroundColor Cyan
    $yarnCommand = "npm run"
}

Write-Host "Iniciando servidor Open SWE..." -ForegroundColor Green
Write-Host "Comando: $yarnCommand dev" -ForegroundColor Gray
Write-Host ""
Write-Host "MONITOREA LOS LOGS PARA:" -ForegroundColor Yellow
Write-Host "  - Memory usage reports cada 5 segundos" -ForegroundColor White
Write-Host "  - Warnings cuando heap > 11.2GB" -ForegroundColor White
Write-Host "  - Critical alerts cuando heap > 13.6GB" -ForegroundColor White
Write-Host "  - mu values > 0.5 (efectividad de GC)" -ForegroundColor White
Write-Host "  - Sin 'allocation failure' messages" -ForegroundColor White
Write-Host ""

# Ejecutar el comando
if ($yarnCommand -eq "npm run") {
    npm run dev
} else {
    Invoke-Expression "$yarnCommand dev"
}
