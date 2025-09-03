# Script para iniciar ambos servidores con npm
Write-Host "🚀 Iniciando Open SWE completo con npm..." -ForegroundColor Green

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