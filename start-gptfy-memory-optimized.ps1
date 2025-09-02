# Script optimizado para iniciar GPTfy con todas las optimizaciones de memoria
# Implementa la estrategia de GPT5: Estado magro + Workers + Watchdog
# Versión corregida para Windows (sin SIGUSR2)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " ___ ____ _______" -ForegroundColor Yellow
Write-Host "/ _ \ _ __ ___ _ __" -ForegroundColor Yellow
Write-Host "/ ___| | _____| | | | | '_ \ / _ \ '_ \" -ForegroundColor Yellow
Write-Host "\___ \ \ /| |__ | |_| | |_) | __/ | | | ___)\ \/\/ | __| \___/| .__/ \___|_| |_| |____/\_/\_/|_____| |_|" -ForegroundColor Yellow
Write-Host "GPTfy - Memory Optimized Mode (Windows)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

# Configuración de optimizaciones de memoria (Estrategia GPT5)
Write-Host "[CONFIG] Configurando optimizaciones de memoria..." -ForegroundColor Green

# Capa 1: Estado magro + serializer redactor
$env:LG_REDACTING_SERDE = "on"
$env:LG_STATE_BLOBS = "off"  # No metas file_text en state

# Capa 2: Watchdog de memoria
$env:LG_MEM_WATCHDOG = "on"

# Capa 3: Workers aislados
$env:LG_USE_WORKERS = "on"

# Capa 4: JSON streaming (solo donde sea necesario)
$env:LG_STREAM_JSON = "off"

# Configuración de memoria optimizada
$env:LG_MAX_HEAP_SIZE = "8192"  # 8GB para proyectos grandes
$env:LG_HEAP_THRESHOLD = "0.85"  # Snapshot al 85%
$env:LG_MAX_STRING_SIZE = "200000"  # 200KB antes de externalizar
$env:LG_MAX_ARRAY_SIZE = "2000"
$env:LG_MAX_OBJECT_KEYS = "2000"
$env:LG_BLOB_DIR = ".lg-blobs"

# NODE_OPTIONS optimizados para Windows (sin SIGUSR2)
$env:NODE_OPTIONS = "--max-old-space-size=8192 --expose-gc"

Write-Host "✅ Configuración de memoria optimizada:" -ForegroundColor Green
Write-Host "  - Heap máximo: 8GB" -ForegroundColor White
Write-Host "  - Serializer redactor: ACTIVADO" -ForegroundColor White
Write-Host "  - Watchdog de memoria: ACTIVADO" -ForegroundColor White
Write-Host "  - Workers aislados: ACTIVADO" -ForegroundColor White
Write-Host "  - Estado magro: ACTIVADO" -ForegroundColor White
Write-Host "  - Compatibilidad Windows: ACTIVADA" -ForegroundColor White

# Verificar requisitos
Write-Host "[CHECKING] Verificando requisitos..." -ForegroundColor Yellow

# Verificar Node.js
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar WSL2
$wslAvailable = wsl --status 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ WSL2 disponible" -ForegroundColor Green
} else {
    Write-Host "⚠️  WSL2 no disponible (modo local)" -ForegroundColor Yellow
}

# Limpiar procesos existentes
Write-Host "[CLEANUP] Deteniendo procesos existentes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses.Count -gt 0) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Procesos limpiados" -ForegroundColor Green
} else {
    Write-Host "✅ No hay procesos de Node.js ejecutándose" -ForegroundColor Green
}

# Limpiar directorio de blobs si existe
if (Test-Path $env:LG_BLOB_DIR) {
    Remove-Item -Recurse -Force $env:LG_BLOB_DIR
    Write-Host "✅ Directorio de blobs limpiado" -ForegroundColor Green
}

# Configurar variables de entorno
Write-Host "[CONFIG] Configurando variables de entorno..." -ForegroundColor Yellow

# Modo local
$env:LOCAL_MODE = "true"
Write-Host "✅ Modo local activado" -ForegroundColor Green

# Clave de encriptación
$env:ENCRYPTION_KEY = "your-secret-key-here"
Write-Host "✅ Clave de encriptacion configurada" -ForegroundColor Green

# Ruta de proyectos
$env:PROJECTS_PATH = "C:\Users\$env:USERNAME\open-swe-projects"
Write-Host "✅ Ruta de proyectos: $env:PROJECTS_PATH" -ForegroundColor Green

# Crear directorio de proyectos si no existe
if (!(Test-Path $env:PROJECTS_PATH)) {
    New-Item -ItemType Directory -Path $env:PROJECTS_PATH -Force | Out-Null
    Write-Host "✅ Directorio de proyectos creado" -ForegroundColor Green
}

# Iniciar servicios con configuración optimizada
Write-Host "[STARTING] Iniciando servicios con optimizaciones de memoria..." -ForegroundColor Yellow

# Iniciar API Server (Agent) en background con optimizaciones
Write-Host "🚀 Iniciando API Server (puerto 2024) con optimizaciones..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node yarn.js workspace @open-swe/agent dev" -WindowStyle Normal

# Esperar un momento para que el servidor se inicie
Start-Sleep -Seconds 3

# Iniciar Web Interface en background con optimizaciones
Write-Host "🌐 Iniciando Web Interface (puerto 3000) con optimizaciones..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node yarn.js workspace @open-swe/web dev" -WindowStyle Normal

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Servicios iniciados con optimizaciones de memoria:" -ForegroundColor Green
Write-Host "* API Server: http://localhost:2024" -ForegroundColor White
Write-Host "* Web Interface: http://localhost:3000" -ForegroundColor White
Write-Host "* Proyectos guardados en: $env:PROJECTS_PATH" -ForegroundColor White
Write-Host "* Blobs externalizados en: $env:LG_BLOB_DIR" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan

# Verificar servicios
Write-Host "[VERIFY] Verificando servicios..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar puerto 2024
$port2024 = Test-NetConnection -ComputerName 127.0.0.1 -Port 2024 -WarningAction SilentlyContinue
if ($port2024.TcpTestSucceeded) {
    Write-Host "✅ API Server respondiendo en puerto 2024" -ForegroundColor Green
} else {
    Write-Host "⚠️  API Server no responde aún (puede tardar más)" -ForegroundColor Yellow
}

# Verificar puerto 3000
$port3000 = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -WarningAction SilentlyContinue
if ($port3000.TcpTestSucceeded) {
    Write-Host "✅ Web Server respondiendo en puerto 3000" -ForegroundColor Green
} else {
    Write-Host "⚠️  Web Server no responde aún (puede tardar más)" -ForegroundColor Yellow
}

Write-Host "`n🎉 Sistema GPTfy iniciado con optimizaciones de memoria!" -ForegroundColor Green
Write-Host "💡 Optimizaciones activadas:" -ForegroundColor Cyan
Write-Host "  • Serializer redactor (evita Invalid string length)" -ForegroundColor White
Write-Host "  • Watchdog de memoria (snapshots automáticos)" -ForegroundColor White
Write-Host "  • Workers aislados (reset de heap entre pasos)" -ForegroundColor White
Write-Host "  • Estado magro (solo paths/IDs en memoria)" -ForegroundColor White
Write-Host "  • Compatibilidad Windows (sin SIGUSR2)" -ForegroundColor White
Write-Host "💾 Configuración de memoria: 8GB heap máximo" -ForegroundColor Cyan

Write-Host "`nPresiona cualquier tecla para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
