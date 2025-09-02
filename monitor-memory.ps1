# Script para monitorear el uso de memoria de Node.js
# Previene errores de "JavaScript heap out of memory"

Write-Host "🔍 Monitor de Memoria - GPTfy" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

function Get-MemoryUsage {
    $nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
    
    if ($nodeProcesses.Count -eq 0) {
        Write-Host "❌ No hay procesos de Node.js ejecutándose" -ForegroundColor Red
        return
    }
    
    Write-Host "📊 Procesos de Node.js encontrados:" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Gray
    
    foreach ($process in $nodeProcesses) {
        $memoryMB = [math]::Round($process.WorkingSet64 / 1MB, 2)
        $memoryGB = [math]::Round($memoryMB / 1024, 2)
        
        # Determinar el nivel de alerta
        if ($memoryGB -gt 3.5) {
            $color = "Red"
            $status = "⚠️  ALTO USO DE MEMORIA"
        } elseif ($memoryGB -gt 2.5) {
            $color = "Yellow"
            $status = "⚠️  USO MODERADO"
        } else {
            $color = "Green"
            $status = "✅ NORMAL"
        }
        
        Write-Host "PID: $($process.Id)" -ForegroundColor White
        Write-Host "Memoria: $memoryMB MB ($memoryGB GB)" -ForegroundColor $color
        Write-Host "Estado: $status" -ForegroundColor $color
        Write-Host "CPU: $([math]::Round($process.CPU, 2))s" -ForegroundColor White
        Write-Host "--------------------------------------------" -ForegroundColor Gray
    }
    
    # Verificar puertos
    Write-Host "`n🌐 Verificación de servicios:" -ForegroundColor Cyan
    
    $port2024 = Test-NetConnection -ComputerName 127.0.0.1 -Port 2024 -WarningAction SilentlyContinue
    if ($port2024.TcpTestSucceeded) {
        Write-Host "✅ API Server (puerto 2024): ACTIVO" -ForegroundColor Green
    } else {
        Write-Host "❌ API Server (puerto 2024): INACTIVO" -ForegroundColor Red
    }
    
    $port3000 = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -WarningAction SilentlyContinue
    if ($port3000.TcpTestSucceeded) {
        Write-Host "✅ Web Interface (puerto 3000): ACTIVO" -ForegroundColor Green
    } else {
        Write-Host "❌ Web Interface (puerto 3000): INACTIVO" -ForegroundColor Red
    }
}

function Show-MemoryTips {
    Write-Host "`n💡 Consejos para optimizar memoria:" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Gray
    Write-Host "• Si el uso de memoria supera 3.5GB, reinicia los servicios" -ForegroundColor White
    Write-Host "• Usa el script 'start-openswe-optimized.ps1' para configuración optimizada" -ForegroundColor White
    Write-Host "• Cierra proyectos grandes cuando no los uses" -ForegroundColor White
    Write-Host "• Monitorea regularmente con este script" -ForegroundColor White
}

function Restart-Services {
    Write-Host "`n🔄 ¿Deseas reiniciar los servicios? (s/n): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    
    if ($response -eq "s" -or $response -eq "S") {
        Write-Host "🔄 Reiniciando servicios..." -ForegroundColor Cyan
        
        # Matar procesos de Node.js
        $nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
        if ($nodeProcesses.Count -gt 0) {
            $nodeProcesses | Stop-Process -Force
            Write-Host "✅ Procesos terminados" -ForegroundColor Green
        }
        
        # Reiniciar con configuración optimizada
        Write-Host "🚀 Reiniciando con configuración optimizada..." -ForegroundColor Cyan
        & ".\start-openswe-optimized.ps1"
    } else {
        Write-Host "❌ Reinicio cancelado" -ForegroundColor Red
    }
}

# Ejecutar monitoreo
Get-MemoryUsage
Show-MemoryTips

# Preguntar si quiere reiniciar
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses.Count -gt 0) {
    $totalMemoryGB = ($nodeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1GB
    if ($totalMemoryGB -gt 3.5) {
        Write-Host "`n⚠️  ADVERTENCIA: Uso total de memoria alto ($([math]::Round($totalMemoryGB, 2)) GB)" -ForegroundColor Red
        Restart-Services
    }
}

Write-Host "`nPresiona cualquier tecla para cerrar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
