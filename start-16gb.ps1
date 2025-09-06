# Open SWE - Inicio con 16GB heap
# Script para Windows PowerShell

Write-Host "Iniciando Open SWE con configuracion de 16GB..." -ForegroundColor Green

# Configurar variables de entorno
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

Write-Host "Configuracion de memoria:" -ForegroundColor Yellow
Write-Host "  - Heap limite: 16GB" -ForegroundColor White
Write-Host "  - Document Cache: 250MB" -ForegroundColor White
Write-Host "  - String limite: 25MB" -ForegroundColor White
Write-Host "  - Message limite: 35MB" -ForegroundColor White
Write-Host "  - Warning: 11.2GB, Critical: 13.6GB" -ForegroundColor White
Write-Host ""

# Iniciar la aplicación
Write-Host "Iniciando servidor..." -ForegroundColor Green
npm run dev
