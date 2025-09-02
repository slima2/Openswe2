# Script para tomar snapshots manuales de memoria en Windows
# Útil para análisis de fugas de memoria

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 GPTfy - Memory Snapshot Tool (Windows)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

# Función para obtener procesos de Node.js
function Get-NodeProcesses {
    return Get-Process | Where-Object {$_.ProcessName -like "*node*"}
}

# Función para mostrar información de memoria
function Show-MemoryInfo {
    param($Process)
    
    $memInfo = $Process | Select-Object Id, ProcessName, @{
        Name = "Memory(MB)"; 
        Expression = {[math]::Round($_.WorkingSet64 / 1MB, 2)}
    }, @{
        Name = "CPU(s)"; 
        Expression = {[math]::Round($_.CPU, 2)}
    }
    
    return $memInfo
}

# Mostrar procesos de Node.js activos
Write-Host "[INFO] Procesos de Node.js activos:" -ForegroundColor Yellow
$nodeProcesses = Get-NodeProcesses

if ($nodeProcesses.Count -eq 0) {
    Write-Host "❌ No hay procesos de Node.js ejecutándose" -ForegroundColor Red
    exit 1
}

$nodeProcesses | Format-Table Id, ProcessName, @{
    Name = "Memory(MB)"; 
    Expression = {[math]::Round($_.WorkingSet64 / 1MB, 2)}
}, @{
    Name = "CPU(s)"; 
    Expression = {[math]::Round($_.CPU, 2)}
} -AutoSize

# Función para tomar snapshot manual
function Take-ManualSnapshot {
    param($ProcessId)
    
    Write-Host "📸 Tomando snapshot manual del proceso $ProcessId..." -ForegroundColor Cyan
    
    try {
        # Usar el Inspector API para tomar snapshot
        $snapshotFile = "heap-manual-$(Get-Date -Format 'yyyyMMdd-HHmmss').heapsnapshot"
        
        # Crear script temporal para tomar snapshot
        $tempScript = @"
const { Session } = require('node:inspector/promises');
const fs = require('node:fs');

async function takeSnapshot() {
    const session = new Session();
    session.connect();
    const fd = fs.openSync('$snapshotFile', 'w');
    
    session.on('HeapProfiler.addHeapSnapshotChunk', (m) => 
        fs.writeSync(fd, m.params.chunk)
    );
    
    await session.post('HeapProfiler.enable');
    await session.post('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
    await session.post('HeapProfiler.disable');
    
    session.disconnect();
    fs.closeSync(fd);
    console.log('Snapshot saved to: $snapshotFile');
}

takeSnapshot().catch(console.error);
"@
        
        $tempScript | Out-File -FilePath "temp-snapshot.js" -Encoding UTF8
        
        # Ejecutar el script
        node temp-snapshot.js
        
        # Limpiar archivo temporal
        Remove-Item "temp-snapshot.js" -Force
        
        Write-Host "✅ Snapshot guardado en: $snapshotFile" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Error al tomar snapshot: $_" -ForegroundColor Red
    }
}

# Función para analizar snapshots
function Analyze-Snapshots {
    Write-Host "`n📊 Análisis de snapshots disponibles:" -ForegroundColor Yellow
    
    $snapshots = Get-ChildItem -Path "." -Filter "*.heapsnapshot" | Sort-Object LastWriteTime -Descending
    
    if ($snapshots.Count -eq 0) {
        Write-Host "❌ No se encontraron snapshots" -ForegroundColor Red
        return
    }
    
    Write-Host "Snapshots encontrados:" -ForegroundColor Cyan
    $snapshots | Format-Table Name, Length, LastWriteTime -AutoSize
    
    Write-Host "`n💡 Para analizar snapshots:" -ForegroundColor Yellow
    Write-Host "1. Abre Chrome DevTools" -ForegroundColor White
    Write-Host "2. Ve a Memory tab" -ForegroundColor White
    Write-Host "3. Haz clic en 'Load' y selecciona un archivo .heapsnapshot" -ForegroundColor White
    Write-Host "4. Compara snapshots para identificar fugas de memoria" -ForegroundColor White
}

# Menú principal
do {
    Write-Host "`n🔧 Opciones disponibles:" -ForegroundColor Cyan
    Write-Host "1. Mostrar información de memoria actual" -ForegroundColor White
    Write-Host "2. Tomar snapshot manual" -ForegroundColor White
    Write-Host "3. Analizar snapshots disponibles" -ForegroundColor White
    Write-Host "4. Limpiar snapshots antiguos" -ForegroundColor White
    Write-Host "5. Salir" -ForegroundColor White
    
    $choice = Read-Host "`nSelecciona una opción (1-5)"
    
    switch ($choice) {
        "1" {
            Write-Host "`n📊 Información de memoria actual:" -ForegroundColor Yellow
            Get-NodeProcesses | Format-Table Id, ProcessName, @{
                Name = "Memory(MB)"; 
                Expression = {[math]::Round($_.WorkingSet64 / 1MB, 2)}
            }, @{
                Name = "CPU(s)"; 
                Expression = {[math]::Round($_.CPU, 2)}
            } -AutoSize
        }
        "2" {
            $processId = Read-Host "Ingresa el ID del proceso (o presiona Enter para el primer proceso)"
            if ([string]::IsNullOrEmpty($processId)) {
                $processId = (Get-NodeProcesses | Select-Object -First 1).Id
            }
            Take-ManualSnapshot -ProcessId $processId
        }
        "3" {
            Analyze-Snapshots
        }
        "4" {
            $confirm = Read-Host "¿Eliminar snapshots más antiguos que 7 días? (s/N)"
            if ($confirm -eq "s" -or $confirm -eq "S") {
                $cutoffDate = (Get-Date).AddDays(-7)
                $oldSnapshots = Get-ChildItem -Path "." -Filter "*.heapsnapshot" | Where-Object {$_.LastWriteTime -lt $cutoffDate}
                if ($oldSnapshots.Count -gt 0) {
                    $oldSnapshots | Remove-Item -Force
                    Write-Host "✅ Eliminados $($oldSnapshots.Count) snapshots antiguos" -ForegroundColor Green
                } else {
                    Write-Host "ℹ️  No hay snapshots antiguos para eliminar" -ForegroundColor Yellow
                }
            }
        }
        "5" {
            Write-Host "👋 ¡Hasta luego!" -ForegroundColor Green
            break
        }
        default {
            Write-Host "❌ Opción inválida" -ForegroundColor Red
        }
    }
} while ($true)
