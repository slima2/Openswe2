# Script para crear los archivos .env necesarios
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "CREANDO ARCHIVOS .ENV PARA OPEN SWE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Crear apps\open-swe\.env
$backendEnvPath = "apps\open-swe\.env"
Write-Host "Creando: $backendEnvPath" -ForegroundColor Yellow

$backendContent = @"
# Modo Local (sin Daytona - GRATIS)
OPEN_SWE_LOCAL_MODE=true
OPEN_SWE_PROJECT_PATH=D:\Dropbox\EDUCASTLE\OPENSWE2\open-swe-main

# LangSmith (opcional)
LANGCHAIN_PROJECT="default"
LANGCHAIN_API_KEY=""
LANGCHAIN_TRACING_V2="false"

# LLM Provider - NECESITAS AL MENOS UNO DE ESTOS
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""

# Infrastructure (NO necesario en modo local)
DAYTONA_API_KEY=""

# GitHub App - REEMPLAZA CON TUS VALORES REALES
# Ve a: https://github.com/settings/apps
GITHUB_APP_NAME="OpenSWE2"
GITHUB_APP_ID="1831432"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
PEGA_AQUI_TU_PRIVATE_KEY_COMPLETA
-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="dummy-webhook-for-local-dev"

# Server config
PORT="2024"
OPEN_SWE_APP_URL="http://localhost:3000"
SECRETS_ENCRYPTION_KEY="8B6D8A9548531924EC59BA36DF9EA9FE8465C8E23E3C581A2E30CC05014B14A3"
SKIP_CI_UNTIL_LAST_COMMIT="true"
"@

$backendContent | Out-File -FilePath $backendEnvPath -Encoding UTF8
Write-Host "[OK] Creado: $backendEnvPath" -ForegroundColor Green

# Crear apps\web\.env.local
$frontendEnvPath = "apps\web\.env.local"
Write-Host "Creando: $frontendEnvPath" -ForegroundColor Yellow

$frontendContent = @"
# Modo Local
OPEN_SWE_LOCAL_MODE=true

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
LANGGRAPH_API_URL="http://localhost:2024"

# Encryption
SECRETS_ENCRYPTION_KEY="8B6D8A9548531924EC59BA36DF9EA9FE8465C8E23E3C581A2E30CC05014B14A3"

# GitHub OAuth - REEMPLAZA CON TUS VALORES REALES
# Ve a: https://github.com/settings/apps
NEXT_PUBLIC_GITHUB_APP_CLIENT_ID="PON_TU_CLIENT_ID_AQUI"
GITHUB_APP_CLIENT_SECRET="PON_TU_CLIENT_SECRET_AQUI"
GITHUB_APP_REDIRECT_URI="http://localhost:3000/api/auth/github/callback"

# GitHub App - MISMOS VALORES QUE EN apps/open-swe/.env
GITHUB_APP_NAME="OpenSWE2"
GITHUB_APP_ID="1831432"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
PEGA_AQUI_TU_PRIVATE_KEY_COMPLETA
-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="dummy-webhook-for-local-dev"
"@

$frontendContent | Out-File -FilePath $frontendEnvPath -Encoding UTF8
Write-Host "[OK] Creado: $frontendEnvPath" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "ARCHIVOS CREADOS EXITOSAMENTE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "AHORA DEBES:" -ForegroundColor Yellow
Write-Host "1. Ve a https://github.com/settings/apps" -ForegroundColor White
Write-Host "2. Busca tu app 'OpenSWE2'" -ForegroundColor White
Write-Host "3. Copia el Client ID y Client Secret" -ForegroundColor White
Write-Host "4. Descarga la Private Key (.pem)" -ForegroundColor White
Write-Host "5. Edita los archivos .env y pega tus valores reales" -ForegroundColor White
Write-Host ""
Write-Host "Archivos a editar:" -ForegroundColor Yellow
Write-Host "  - $backendEnvPath" -ForegroundColor Cyan
Write-Host "  - $frontendEnvPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Después reinicia los servidores con Ctrl+C y vuelve a iniciar" -ForegroundColor Yellow

