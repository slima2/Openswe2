# Script para matar procesos de Node.js
Write-Host "🔍 Buscando procesos de Node.js..." -ForegroundColor Yellow

$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}

if ($nodeProcesses.Count -eq 0) {
    Write-Host "✅ No hay procesos de Node.js ejecutándose" -ForegroundColor Green
} else {
    Write-Host "📋 Procesos de Node.js encontrados:" -ForegroundColor Cyan
    $nodeProcesses | Format-Table Id, ProcessName, CPU, WorkingSet -AutoSize
    
    Write-Host "`n🔪 Matando procesos de Node.js..." -ForegroundColor Red
    $nodeProcesses | Stop-Process -Force
    
    Write-Host "✅ Todos los procesos de Node.js han sido terminados" -ForegroundColor Green
}

# Verificar puertos específicos
Write-Host "`n🔍 Verificando puertos 2024 y 3000..." -ForegroundColor Yellow
$port2024 = Get-NetTCPConnection -LocalPort 2024 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port2024) {
    Write-Host "⚠️  Puerto 2024 aún en uso" -ForegroundColor Yellow
} else {
    Write-Host "✅ Puerto 2024 libre" -ForegroundColor Green
}

if ($port3000) {
    Write-Host "⚠️  Puerto 3000 aún en uso" -ForegroundColor Yellow
} else {
    Write-Host "✅ Puerto 3000 libre" -ForegroundColor Green
}
