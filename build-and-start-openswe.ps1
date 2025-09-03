# Script para compilar y ejecutar Open SWE completo con npm
Write-Host "🔨 Compilando Open SWE completo con npm..." -ForegroundColor Green

# Compilar shared package primero
Write-Host "  --> Compilando paquete shared..." -ForegroundColor Yellow
Set-Location packages\shared
npx rimraf ./dist .turbo
npx tsc
Write-Host "  ✅ Shared package compilado" -ForegroundColor Green

# Volver al directorio raíz
Set-Location ..\..

# Compilar web package
Write-Host "  --> Compilando paquete web..." -ForegroundColor Yellow
Set-Location apps\web
npm run build
Write-Host "  ✅ Web package compilado" -ForegroundColor Green

# Volver al directorio raíz
Set-Location ..\..

Write-Host "✅ Compilación completada!" -ForegroundColor Green
Write-Host "🚀 Iniciando servidores..." -ForegroundColor Cyan

# Iniciar Backend en una nueva ventana
Write-Host "  --> Iniciando Backend..." -ForegroundColor Yellow
$backendCommand = "Set-Location apps\open-swe; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -WindowStyle Normal
  
# Esperar un momento
Start-Sleep -Seconds 3
  
# Iniciar Frontend en una nueva ventana
Write-Host "  --> Iniciando Frontend..." -ForegroundColor Yellow
$frontendCommand = "Set-Location apps\web; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand -WindowStyle Normal
  
Write-Host "✅ Servidores iniciados!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:2024" -ForegroundColor Cyan
