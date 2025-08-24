# 🚀 Ejecutar Open SWE sin Daytona (Modo Local Gratuito)

## ⚡ Resumen Rápido
Open SWE puede ejecutarse **completamente gratis** sin Daytona usando el **Modo Local**. Este modo ejecuta el código directamente en tu máquina en lugar de usar sandboxes en la nube.

## 🔧 Opción 1: Modo Local (Recomendado)

### Configuración Simple

1. **Añade esta línea a tu archivo `.env`** en `apps/open-swe/.env`:
```env
OPEN_SWE_LOCAL_MODE=true
OPEN_SWE_PROJECT_PATH=D:\Dropbox\EDUCASTLE\OPENSWE2\open-swe-main
```

2. **Reinicia los servidores**:
```powershell
# Mata todos los procesos
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Terminal 1: Agent Server
cd D:\Dropbox\EDUCASTLE\OPENSWE2\open-swe-main\apps\open-swe
node ..\..\yarn.js dev

# Terminal 2: Web Server
cd D:\Dropbox\EDUCASTLE\OPENSWE2\open-swe-main\apps\web
node ..\..\yarn.js dev
```

### ⚠️ Limitaciones del Modo Local
- **Menos seguro**: El código se ejecuta directamente en tu máquina
- **Sin aislamiento**: Los cambios afectan tu sistema local
- **Cuidado con comandos destructivos**: No hay sandbox de protección
- **Ideal para desarrollo**: Perfecto para proyectos propios

### ✅ Ventajas del Modo Local
- **100% Gratis**: Sin costos de Daytona
- **Más rápido**: No hay latencia de red
- **Sin límites**: No hay restricciones de créditos o tiempo
- **Control total**: Todo corre en tu máquina

## 🐳 Opción 2: Docker Local (Alternativa con Aislamiento)

Si quieres más seguridad que el modo local pero sin pagar por Daytona, puedes usar Docker:

### Configuración con Docker

1. **Instala Docker Desktop** (si no lo tienes):
   - Descarga desde: https://www.docker.com/products/docker-desktop/
   - Instala y reinicia tu PC

2. **Crea un Dockerfile** en el root del proyecto:
```dockerfile
FROM node:20-alpine
WORKDIR /workspace
RUN apk add --no-cache git python3 make g++
COPY . .
RUN npm install
EXPOSE 2024 3000
CMD ["npm", "run", "dev"]
```

3. **Modifica el código para usar Docker** (esto requiere desarrollo adicional):
   - Necesitarías crear un wrapper que ejecute comandos en contenedores Docker
   - Reemplazar las llamadas a Daytona con comandos de Docker

## 🛠️ Opción 3: CLI de Open SWE (Modo Local Automático)

Open SWE también tiene una CLI que **siempre corre en modo local**:

```powershell
# Instala la CLI globalmente
npm install -g @open-swe/cli

# Úsala en cualquier proyecto
cd tu-proyecto
open-swe
```

La CLI automáticamente configura `OPEN_SWE_LOCAL_MODE=true`.

## 📝 Configuración Completa para Modo Local

### Archivo `.env` completo para `apps/open-swe/.env`:
```env
# Modo Local (sin Daytona)
OPEN_SWE_LOCAL_MODE=true
OPEN_SWE_PROJECT_PATH=D:\Dropbox\EDUCASTLE\OPENSWE2\open-swe-main

# GitHub Configuration
GITHUB_APP_ID=tu-app-id
GITHUB_APP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GITHUB_WEBHOOK_SECRET=tu-webhook-secret
OPEN_SWE_APP_URL=https://tu-ngrok-url.ngrok-free.app

# LLM API Keys
OPENAI_API_KEY=tu-openai-key
ANTHROPIC_API_KEY=tu-anthropic-key

# Optional: Si tienes Daytona pero no quieres usarlo
# DAYTONA_API_KEY=skip
# DAYTONA_ORGANIZATION_ID=skip
```

## 🔍 Verificar que el Modo Local está Activo

Cuando inicies el servidor, deberías ver en los logs:
- Referencias a `LocalShellExecutor` en lugar de sandbox
- Mensajes indicando "skipped" para creación de sandbox
- Ejecución directa de comandos en tu sistema

## 💡 Recomendaciones de Seguridad para Modo Local

1. **Usa un directorio de trabajo específico**:
   ```env
   OPEN_SWE_PROJECT_PATH=C:\OpenSWE\workspace
   ```

2. **Trabaja en ramas separadas** de Git para aislar cambios

3. **Ten backups** de tu código importante

4. **Revisa los comandos** antes de que Open SWE los ejecute

5. **Usa una máquina virtual** si trabajas con código sensible

## 🚀 Alternativas Futuras

### Podman (Sin Docker Desktop)
- Alternativa gratuita a Docker
- Compatible con contenedores OCI
- No requiere licencia comercial

### GitHub Codespaces (Limitado Gratis)
- 60 horas gratis al mes
- Entorno completamente aislado
- Integración nativa con GitHub

### Gitpod (Limitado Gratis)
- 50 horas gratis al mes
- Similar a Codespaces
- Soporta múltiples proveedores Git

## ✅ Resumen

**Para empezar gratis ahora mismo:**
1. Añade `OPEN_SWE_LOCAL_MODE=true` a tu `.env`
2. Reinicia los servidores
3. ¡Listo! Open SWE funcionará sin Daytona

**Ventajas**: Gratis, rápido, sin límites
**Desventajas**: Menos seguro, sin aislamiento

---

💡 **Nota**: El modo local es perfectamente adecuado para desarrollo personal y proyectos propios. Solo ten cuidado si trabajas con código no confiable.
