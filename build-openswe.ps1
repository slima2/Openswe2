# Script para compilar Open SWE con npm
Write-Host "Compilando Open SWE con npm..." -ForegroundColor Green

# Compilar shared package primero
Write-Host "  --> Compilando paquete shared..." -ForegroundColor Yellow
Set-Location packages\shared
npx rimraf ./dist .turbo
npx tsc
Write-Host "  Shared package compilado" -ForegroundColor Green

# Volver al directorio raíz
Set-Location ..\..

# Compilar web package
Write-Host "  --> Compilando paquete web..." -ForegroundColor Yellow
Set-Location apps\web
npm run build
Write-Host "  Web package compilado" -ForegroundColor Green

# Volver al directorio raíz
Set-Location ..\..

Write-Host "Compilacion completada!" -ForegroundColor Green
Write-Host "Ahora puedes ejecutar: .\start-openswe.ps1" -ForegroundColor Cyan
