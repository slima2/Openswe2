# Open SWE - Inicio DIRECTO con 16GB heap
# Evita problemas con yarn/npm usando Node.js directamente

Write-Host "=== OPEN SWE - INICIO DIRECTO 16GB ===" -ForegroundColor Green

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

Write-Host "Heap limite: 16GB configurado" -ForegroundColor Yellow
Write-Host "Optimizaciones de memoria: ACTIVADAS" -ForegroundColor Green
Write-Host ""

# Verificar que Node.js esté disponible
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Node.js no encontrado en el PATH" -ForegroundColor Red
    Write-Host "Instala Node.js desde https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Buscar el servidor principal
$serverPaths = @(
    ".\start-moderate-16gb.js",
    ".\apps\open-swe\dist\server.js",
    ".\apps\open-swe\src\server.ts"
)

$serverFound = $false
foreach ($path in $serverPaths) {
    if (Test-Path $path) {
        Write-Host "Iniciando servidor desde: $path" -ForegroundColor Green
        node $path
        $serverFound = $true
        break
    }
}

if (-not $serverFound) {
    Write-Host "No se encontro el servidor. Intentando build..." -ForegroundColor Yellow
    
    # Intentar build con npm
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Write-Host "Ejecutando npm run build..." -ForegroundColor Cyan
        npm run build
        
        # Reintentar encontrar el servidor
        foreach ($path in $serverPaths) {
            if (Test-Path $path) {
                Write-Host "Servidor encontrado despues del build: $path" -ForegroundColor Green
                node $path
                $serverFound = $true
                break
            }
        }
    }
    
    if (-not $serverFound) {
        Write-Host "ERROR: No se pudo encontrar o construir el servidor" -ForegroundColor Red
        Write-Host "Verifica que el proyecto este correctamente configurado" -ForegroundColor Yellow
        exit 1
    }
}
