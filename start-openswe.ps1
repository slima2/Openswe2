# Script para iniciar Open SWE completo con configuración optimizada
# Evita errores de memoria y configura el entorno correctamente

Write-Host @"
============================================
     ___                      ____        _______ 
    / _ \ _ __   ___ _ __    / ___|      |  _____|
   | | | | '_ \ / _ \ '_ \   \___ \ \    /| |__    
   | |_| | |_) |  __/ | | |   ___) \ \/\/ |  __|   
    \___/| .__/ \___|_| |_|  |____/ \_/\_/|_____| 
         |_|                                        
   Open Software Engineering Agent - Local Mode
============================================
"@ -ForegroundColor Cyan

Write-Host ""

# Función para verificar requisitos
function Test-Requirements {
    Write-Host "[CHECKING] Verificando requisitos..." -ForegroundColor Yellow
    
    # Verificar Node.js
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK - Node.js instalado: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "  ERROR - Node.js no encontrado - instalalo primero" -ForegroundColor Red
        return $false
    }
    
    # Verificar WSL2
    $wslStatus = wsl --status 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK - WSL2 disponible" -ForegroundColor Green
    } else {
        Write-Host "  WARN - WSL2 no disponible - algunos comandos podrian fallar" -ForegroundColor Yellow
    }
    
    return $true
}

# Función para detener procesos existentes
function Stop-ExistingProcesses {
    Write-Host "[CLEANUP] Deteniendo procesos existentes..." -ForegroundColor Yellow
    Get-Process node 2>$null | Stop-Process -Force 2>$null
    Start-Sleep -Seconds 2
    Write-Host "  OK - Procesos limpiados" -ForegroundColor Green
}

# Función para configurar variables de entorno
function Set-EnvironmentVariables {
    Write-Host "[CONFIG] Configurando variables de entorno..." -ForegroundColor Yellow
    
    # Configurar modo local
    $env:OPEN_SWE_LOCAL_MODE = "true"
    Write-Host "  OK - Modo local activado" -ForegroundColor Green
    
    # Configurar clave de encriptación
    $env:SECRETS_ENCRYPTION_KEY = "8e46560b5c01570c2f7467a0acaa08b326a2dfa748e91d0d977249499904e6cb"
    Write-Host "  OK - Clave de encriptacion configurada" -ForegroundColor Green
    
    # Configurar ruta del proyecto local
    $env:OPEN_SWE_LOCAL_PROJECT_PATH = "C:\Users\$env:USERNAME\open-swe-projects"
    Write-Host "  OK - Ruta de proyectos: $env:OPEN_SWE_LOCAL_PROJECT_PATH" -ForegroundColor Green
}

# Verificar requisitos
if (-not (Test-Requirements)) {
    Write-Host ""
    Write-Host "[ERROR] Requisitos no cumplidos. Instalacion cancelada." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Detener procesos existentes
Stop-ExistingProcesses

Write-Host ""

# Configurar variables de entorno
Set-EnvironmentVariables

Write-Host ""
Write-Host "[STARTING] Iniciando servidores..." -ForegroundColor Cyan
Write-Host ""

# Iniciar API Server en una nueva ventana
Write-Host "  --> Iniciando API Server (puerto 2024)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:NODE_OPTIONS='--max-old-space-size=8192';",
    "`$env:OPEN_SWE_LOCAL_MODE='true';",
    "`$env:SECRETS_ENCRYPTION_KEY='8e46560b5c01570c2f7467a0acaa08b326a2dfa748e91d0d977249499904e6cb';",
    "cd apps\open-swe;",
    "Write-Host 'API Server - Puerto 2024' -ForegroundColor Cyan;",
    "node ..\..\yarn.js dev"
) -WorkingDirectory $PSScriptRoot

# Esperar un poco antes de iniciar el web server
Start-Sleep -Seconds 5

# Iniciar Web Server en una nueva ventana
Write-Host "  --> Iniciando Web Server (puerto 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:NODE_OPTIONS='--max-old-space-size=4096';",
    "`$env:OPEN_SWE_LOCAL_MODE='true';",
    "`$env:SECRETS_ENCRYPTION_KEY='8e46560b5c01570c2f7467a0acaa08b326a2dfa748e91d0d977249499904e6cb';",
    "cd apps\web;",
    "Write-Host 'Web Server - Puerto 3000' -ForegroundColor Magenta;",
    "node ..\..\yarn.js dev"
) -WorkingDirectory $PSScriptRoot

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " OK - Open SWE iniciado correctamente" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Servicios disponibles:" -ForegroundColor Cyan
Write-Host "  * API Server: http://localhost:2024" -ForegroundColor White
Write-Host "  * Web Interface: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Proyectos guardados en:" -ForegroundColor Cyan
Write-Host "  * $env:OPEN_SWE_LOCAL_PROJECT_PATH" -ForegroundColor White
Write-Host ""
Write-Host "Para detener los servidores, cierra las ventanas de PowerShell" -ForegroundColor Gray
Write-Host ""

# Esperar un poco y verificar que los servidores esten corriendo
Start-Sleep -Seconds 10

Write-Host "[VERIFY] Verificando servicios..." -ForegroundColor Yellow
$apiStatus = Test-NetConnection -ComputerName localhost -Port 2024 -InformationLevel Quiet
$webStatus = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet

if ($apiStatus) {
    Write-Host "  OK - API Server respondiendo" -ForegroundColor Green
} else {
    Write-Host "  WARN - API Server no responde aun (puede tardar mas)" -ForegroundColor Yellow
}

if ($webStatus) {
    Write-Host "  OK - Web Server respondiendo" -ForegroundColor Green
} else {
    Write-Host "  WARN - Web Server no responde aun (puede tardar mas)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Sistema listo. Presiona cualquier tecla para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')