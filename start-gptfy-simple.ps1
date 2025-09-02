# Script simple para iniciar GPTfy sin optimizaciones problemáticas
# Volvemos al estado funcional anterior

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " ___ ____ _______" -ForegroundColor Yellow
Write-Host "/ _ \ _ __ ___ _ __" -ForegroundColor Yellow
Write-Host "/ ___| | _____| | | | | '_ \ / _ \ '_ \" -ForegroundColor Yellow
Write-Host "\___ \ \ /| |__ | |_| | |_) | __/ | | | ___)\ \/\/ | __| \___/| .__/ \___|_| |_| |____/\_/\_/|_____| |_|" -ForegroundColor Yellow
Write-Host "GPTfy - Simple Mode (Rollback)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

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

# Limpiar procesos existentes
Write-Host "[CLEANUP] Deteniendo procesos existentes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses.Count -gt 0) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Procesos limpiados" -ForegroundColor Green
} else {
    Write-Host "✅ No hay procesos de Node.js ejecutándose" -ForegroundColor Green
}

# Configurar variables de entorno básicas
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

# Iniciar servicios con configuración simple
Write-Host "[STARTING] Iniciando servicios con configuración simple..." -ForegroundColor Yellow

# Iniciar API Server (Agent) en background
Write-Host "🚀 Iniciando API Server (puerto 2024)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node yarn.js workspace @open-swe/agent dev" -WindowStyle Normal

# Esperar un momento para que el servidor se inicie
Start-Sleep -Seconds 3

# Iniciar Web Interface en background
Write-Host "🌐 Iniciando Web Interface (puerto 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node yarn.js workspace @open-swe/web dev" -WindowStyle Normal

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Servicios iniciados con configuración simple:" -ForegroundColor Green
Write-Host "* API Server: http://localhost:2024" -ForegroundColor White
Write-Host "* Web Interface: http://localhost:3000" -ForegroundColor White
Write-Host "* Proyectos guardados en: $env:PROJECTS_PATH" -ForegroundColor White
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

Write-Host "`n🎉 Sistema GPTfy iniciado con configuración simple!" -ForegroundColor Green
Write-Host "💡 Estado: Rollback completado - sin optimizaciones problemáticas" -ForegroundColor Cyan

Write-Host "`nPresiona cualquier tecla para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
