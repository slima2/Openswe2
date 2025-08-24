# Arquitectura de Open SWE - Explicación

## ¿Por qué GitHub no puede conectarse directamente?

### Razones Técnicas:

1. **IP Privada**: Tu PC tiene una IP local (192.168.x.x) no accesible desde Internet
2. **NAT/Router**: Tu router bloquea conexiones entrantes no solicitadas
3. **Firewall**: Windows/Antivirus bloquean puertos por seguridad
4. **HTTPS Requerido**: GitHub solo envía webhooks a URLs HTTPS válidas

## Cómo funciona Open SWE:

### CON ngrok (para webhooks):
```
GitHub detecta evento
    ↓
Envía webhook a ngrok.com
    ↓
ngrok túnel → localhost:2024
    ↓
Open SWE procesa el evento
```

### SIN ngrok (recomendado para desarrollo):
```
Tú en la UI (localhost:3000)
    ↓
Creas tarea manualmente
    ↓
Agent procesa (localhost:2024)
    ↓
Llama a GitHub API
    ↓
Crea issues/PRs
```

## Configuración SIN webhooks:

### 1. Crea tu GitHub App sin webhook:
- Ve a: https://github.com/settings/apps/new
- Deja "Active webhook" DESMARCADO
- Configura permisos normalmente

### 2. Usa Open SWE desde la UI:
- Inicia sesión con GitHub OAuth
- Crea tareas desde localhost:3000
- El agent trabajará normalmente

### 3. Ventajas de este método:
✅ No necesitas ngrok
✅ No hay problemas de firewall
✅ Funciona inmediatamente
✅ Todas las features principales disponibles

## Alternativas a ngrok (si necesitas webhooks):

1. **LocalTunnel**: `npx localtunnel --port 2024`
2. **Cloudflare Tunnel**: Gratis con cuenta Cloudflare
3. **Deploy en la nube**: Vercel, Railway, etc.

## Para Producción:

Cuando despliegues Open SWE en producción:
- URL pública real (ej: https://openswe2.vercel.app)
- Webhooks funcionan directamente
- No necesitas túneles

## Comandos para empezar SIN ngrok:

```powershell
# Terminal 1: Agent
cd apps\open-swe
node ..\..\yarn.js dev

# Terminal 2: Web UI
cd apps\web
node ..\..\yarn.js dev
```

Luego ve a: http://localhost:3000
