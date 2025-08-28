# Solución para Error de Memoria en Open SWE

## Problema Identificado

El servidor Open SWE se crasheó con el error:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

Esto ocurre cuando el agente está procesando tareas muy grandes con mucha información (como crear múltiples dashboards complejos).

## Causa del Problema

Los errores de comandos del agente (`Exit code: 127`) ocurren porque:
1. El servidor API se había crasheado por falta de memoria
2. Los comandos no podían ejecutarse porque el LocalShellExecutor no tenía acceso al servidor

## Solución Aplicada

### 1. Aumentar Memoria para Node.js

Configuramos la variable de entorno `NODE_OPTIONS` para aumentar el límite de memoria:

```powershell
# Para el servidor API (8GB)
$env:NODE_OPTIONS="--max-old-space-size=8192"
cd apps\open-swe; node ..\..\yarn.js dev

# Para el servidor Web (4GB) 
$env:NODE_OPTIONS="--max-old-space-size=4096"
cd apps\web; node ..\..\yarn.js dev
```

### 2. Scripts de Inicio Mejorados

Crear scripts de inicio con configuración de memoria:

#### start-api.ps1
```powershell
# Configurar memoria para API server
$env:NODE_OPTIONS="--max-old-space-size=8192"
Write-Host "Iniciando API Server con 8GB de memoria..." -ForegroundColor Green
cd apps\open-swe
node ..\..\yarn.js dev
```

#### start-web.ps1
```powershell
# Configurar memoria para Web server
$env:NODE_OPTIONS="--max-old-space-size=4096"
Write-Host "Iniciando Web Server con 4GB de memoria..." -ForegroundColor Green
cd apps\web
node ..\..\yarn.js dev
```

## Verificación de WSL2

El agente necesita WSL2 funcionando correctamente [[memory:7440216]]:

```powershell
# Verificar WSL
wsl --status

# Probar acceso a proyecto
wsl -d Ubuntu ls -la /mnt/c/Users/slima/open-swe-projects/joanby/joanby
```

## Ubicación de Archivos del Proyecto

Los archivos creados por el agente se guardan en:
- **Windows**: `C:\Users\slima\open-swe-projects\joanby\joanby\`
- **WSL**: `/mnt/c/Users/slima/open-swe-projects/joanby/joanby/`

## Prevención Futura

1. **Monitorear Memoria**: Verificar el uso de memoria regularmente
2. **Dividir Tareas Grandes**: El agente debe dividir tareas muy grandes en partes más pequeñas
3. **Limpiar Caché**: Periódicamente limpiar el caché del agente

## Estado Actual

✅ WSL2 Ubuntu: Funcionando  
✅ API Server: Puerto 2024 (8GB RAM)  
✅ Web Server: Puerto 3000 (4GB RAM)  
✅ LocalShellExecutor: Usando WSL2 para comandos Linux  
✅ Proyecto accesible desde Windows y WSL  

## Comandos Útiles

```powershell
# Ver procesos Node.js
Get-Process node | Select-Object Id, ProcessName, WorkingSet64, VirtualMemorySize64

# Detener todos los procesos Node.js
Get-Process node 2>$null | Stop-Process -Force 2>$null

# Verificar puertos
netstat -an | Select-String -Pattern "(2024|3000)"
```

## Notas

- El error `Exit code: 127` significa "comando no encontrado" - generalmente indica que el servidor no está corriendo
- El límite de memoria por defecto de Node.js es ~2GB, insuficiente para proyectos grandes
- La configuración WSL2 permite ejecutar comandos Linux nativamente en Windows
