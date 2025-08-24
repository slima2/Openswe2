# 🚀 Guía Completa para Configurar GitHub Webhooks con ngrok

## ✅ Cambios Revertidos

Todos los cambios para bypasear webhooks han sido revertidos:
- ✅ Verificación de issues restaurada
- ✅ Requisito de webhook secret restaurado
- ✅ Creación de GitHub Issues obligatoria
- ✅ Modo LOCAL eliminado

## 📋 Pre-requisitos

1. **ngrok descargado** en `D:\Downloads\ngrok`
2. **Firewall deshabilitado** o configurado para permitir ngrok
3. **GitHub App configurada** (OpenSWE2)
4. **Servidores de Open SWE funcionando**

## 🔧 Paso 1: Configurar ngrok

### 1.1 Registrarse en ngrok (si no lo has hecho)
- Ve a https://ngrok.com/
- Crea una cuenta gratuita
- Obtén tu authtoken desde https://dashboard.ngrok.com/get-started/your-authtoken

### 1.2 Configurar authtoken
```powershell
cd D:\Downloads\ngrok
.\ngrok.exe config add-authtoken YOUR-AUTH-TOKEN-HERE
```

## 🌐 Paso 2: Iniciar túnel ngrok

```powershell
# En una nueva terminal PowerShell
cd D:\Downloads\ngrok
.\ngrok.exe http 2024
```

Verás algo como:
```
Session Status                online
Account                       tu-email@example.com
Version                       3.5.0
Region                        United States (us)
Latency                       50ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:2024
```

**⚠️ IMPORTANTE:** Copia la URL de Forwarding (ej: `https://abc123def456.ngrok-free.app`)

## 🔐 Paso 3: Generar Webhook Secret

```powershell
# Generar un secret aleatorio
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

O usa cualquier string seguro, por ejemplo: `my-super-secret-webhook-key-2024`

## 📝 Paso 4: Actualizar archivos .env

### En `apps/open-swe/.env`:
```env
# GitHub Webhook Configuration
GITHUB_WEBHOOK_SECRET=my-super-secret-webhook-key-2024
OPEN_SWE_APP_URL=https://abc123def456.ngrok-free.app
```

### En `apps/web/.env`:
```env
# GitHub Webhook Configuration (opcional para la web)
GITHUB_WEBHOOK_SECRET=my-super-secret-webhook-key-2024
```

## ⚙️ Paso 5: Configurar Webhook en GitHub

1. Ve a tu GitHub App: https://github.com/settings/apps/OpenSWE2
2. En la sección **Webhook**:
   - **Webhook URL**: `https://abc123def456.ngrok-free.app/webhooks/github`
   - **Webhook secret**: `my-super-secret-webhook-key-2024` (el mismo que pusiste en .env)
3. En **Permissions & events**, asegúrate de tener:
   - **Repository permissions**:
     - Issues: Read & Write
     - Pull requests: Read & Write
     - Contents: Read & Write
   - **Subscribe to events**:
     - ✅ Issues
     - ✅ Issue comment
     - ✅ Pull request
4. Click **Save changes**

## 🔄 Paso 6: Reiniciar servidores

```powershell
# Detener todos los procesos
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Terminal 1: Agent Server
cd apps\open-swe
node ..\..\yarn.js dev

# Terminal 2: Web Server  
cd apps\web
node ..\..\yarn.js dev

# Terminal 3: ngrok (si no está corriendo)
cd D:\Downloads\ngrok
.\ngrok.exe http 2024
```

## ✅ Paso 7: Verificar que funciona

### Prueba rápida:
1. Ve a http://localhost:3000
2. Crea una tarea
3. En la consola del agente deberías ver: `Webhook received`

### Prueba completa con labels:
1. Ve a tu repositorio en GitHub: https://github.com/slima2/Openswe2
2. Crea un nuevo issue
3. Añade el label `open-swe` o `open-swe-auto`
4. El webhook debería activar Open SWE automáticamente

## 🚨 Solución de Problemas

### Error: "GitHub Webhook Secret is not configured"
- Verifica que `GITHUB_WEBHOOK_SECRET` esté en ambos archivos .env
- Asegúrate de que no esté comentado (sin #)

### Error: "Webhook signature verification failed"
- El secret en GitHub debe ser EXACTAMENTE igual al de .env
- No incluyas comillas en el .env

### ngrok se desconecta después de 2 horas
- La versión gratuita de ngrok tiene límite de 2 horas
- Simplemente reinicia ngrok y actualiza la URL en GitHub

### No llegan los webhooks
1. Verifica en GitHub Settings > Apps > OpenSWE2 > Advanced > Recent Deliveries
2. Ahí puedes ver si GitHub está enviando los webhooks y qué respuesta recibe

## 📌 Notas Importantes

- **ngrok gratuito**: La URL cambia cada vez que reinicias ngrok
- **Actualiza GitHub**: Cada vez que la URL cambie, actualiza el Webhook URL en GitHub
- **Desarrollo local**: Para desarrollo, puedes usar Open SWE sin webhooks (solo crear tareas desde la UI)
- **Producción**: Para producción, usa un dominio real con HTTPS

## 🎯 Flujo de Trabajo con Webhooks

1. **Trigger automático**: 
   - Alguien crea issue con label `open-swe` → Open SWE se activa automáticamente

2. **Trigger manual desde UI**:
   - Crear tarea en http://localhost:3000 → Crea issue en GitHub → Procesa la tarea

3. **Colaboración**:
   - Los comentarios en el issue de GitHub aparecen en Open SWE
   - Los updates de Open SWE se publican en el issue

## 🔒 Seguridad

- **Nunca compartas** tu webhook secret
- **Usa HTTPS** siempre (ngrok lo proporciona)
- **Rota el secret** periódicamente
- **En producción**, usa un dominio propio con certificado SSL

---

¡Listo! Con estos pasos tendrás webhooks funcionando completamente con Open SWE.
