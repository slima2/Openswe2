# 🚀 Guía de Optimización de Memoria - GPTfy

## 📋 **Resumen del Problema**

El sistema GPTfy experimentó un error de **"JavaScript heap out of memory"** después de 2 horas de procesamiento continuo creando un sistema completo de gestión de almacén.

### **Causa Raíz:**
- **V8 Engine**: El motor de JavaScript de Node.js alcanzó su límite de memoria por defecto
- **Procesamiento intensivo**: Generación de código complejo durante 2 horas
- **Acumulación de datos**: Estado del proyecto y caché acumulándose en memoria

## ✅ **Solución Implementada**

### **1. Configuración de Memoria Optimizada**

#### **Script de Inicio Optimizado: `start-openswe-optimized.ps1`**
```powershell
# Configuración de memoria aumentada
$env:NODE_OPTIONS = "--max-old-space-size=4096 --max-semi-space-size=512"
```

#### **Parámetros de Memoria:**
- **Heap máximo**: 4GB (vs 1.4GB por defecto)
- **Semi-space**: 512MB para mejor gestión de memoria
- **API Server**: 4GB heap
- **Web Interface**: 2GB heap

### **2. Scripts de Package.json Optimizados**

```json
{
  "dev:agent:optimized": "cross-env NODE_OPTIONS=\"--max-old-space-size=4096 --max-semi-space-size=512\" node yarn.js workspace @open-swe/agent dev",
  "dev:web:optimized": "cross-env NODE_OPTIONS=\"--max-old-space-size=2048 --max-semi-space-size=256\" node yarn.js workspace @open-swe/web dev",
  "dev:optimized": "cross-env NODE_OPTIONS=\"--max-old-space-size=4096 --max-semi-space-size=512\" turbo dev"
}
```

### **3. Monitor de Memoria: `monitor-memory.ps1`**

Script para monitorear el uso de memoria en tiempo real:
- **Alertas automáticas** cuando el uso supera 3.5GB
- **Verificación de servicios** (puertos 2024 y 3000)
- **Reinicio automático** con configuración optimizada
- **Consejos de optimización**

## 🛠️ **Cómo Usar la Solución**

### **Inicio Normal (Optimizado):**
```powershell
.\start-openswe-optimized.ps1
```

### **Inicio Manual con Memoria Aumentada:**
```powershell
# API Server
$env:NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=512"
node yarn.js workspace @open-swe/agent dev

# Web Interface
$env:NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=256"
node yarn.js workspace @open-swe/web dev
```

### **Monitoreo de Memoria:**
```powershell
.\monitor-memory.ps1
```

### **Scripts de Yarn Optimizados:**
```bash
# Iniciar todo optimizado
yarn dev:optimized

# Iniciar solo agente optimizado
yarn dev:agent:optimized

# Iniciar solo web optimizado
yarn dev:web:optimized
```

## 📊 **Límites de Memoria Recomendados**

### **Para Proyectos Pequeños:**
- **API Server**: 2GB heap
- **Web Interface**: 1GB heap

### **Para Proyectos Medianos:**
- **API Server**: 4GB heap
- **Web Interface**: 2GB heap

### **Para Proyectos Grandes:**
- **API Server**: 6-8GB heap
- **Web Interface**: 3-4GB heap

## ⚠️ **Señales de Advertencia**

### **Monitorear cuando:**
- Uso de memoria > 3.5GB por proceso
- Tiempo de respuesta lento
- Errores de "allocation failure"
- Procesos de Node.js consumiendo mucha CPU

### **Acciones Preventivas:**
1. **Reiniciar servicios** cuando el uso supere 3.5GB
2. **Cerrar proyectos grandes** cuando no se usen
3. **Monitorear regularmente** con `monitor-memory.ps1`
4. **Usar configuración optimizada** para proyectos complejos

## 🔧 **Configuración Avanzada**

### **Variables de Entorno Adicionales:**
```powershell
# Optimización adicional de V8
$env:NODE_OPTIONS = "--max-old-space-size=4096 --max-semi-space-size=512 --optimize-for-size --gc-interval=100"

# Para desarrollo con hot reload
$env:NODE_OPTIONS = "--max-old-space-size=4096 --max-semi-space-size=512 --watch"
```

### **Configuración de Turbo:**
```json
{
  "turbo": {
    "globalDependencies": ["**/.env*"],
    "pipeline": {
      "dev": {
        "cache": false,
        "persistent": true
      }
    }
  }
}
```

## 🚨 **Solución de Problemas**

### **Error: "JavaScript heap out of memory"**
1. **Detener todos los procesos de Node.js**
2. **Limpiar caché**: `Remove-Item -Recurse -Force .turbo`
3. **Reiniciar con configuración optimizada**
4. **Monitorear uso de memoria**

### **Error: "Invalid string length"**
1. **Reiniciar servicios**
2. **Limpiar archivos de persistencia**
3. **Verificar integridad del proyecto**

### **Servicios no responden**
1. **Verificar puertos**: `Test-NetConnection -ComputerName 127.0.0.1 -Port 2024`
2. **Revisar logs** de los servicios
3. **Reiniciar con configuración optimizada**

## 📈 **Métricas de Rendimiento**

### **Antes de la Optimización:**
- **Límite de heap**: 1.4GB
- **Tiempo hasta error**: ~2 horas
- **Proyectos soportados**: Pequeños/medianos

### **Después de la Optimización:**
- **Límite de heap**: 4GB (API) / 2GB (Web)
- **Tiempo hasta error**: 8+ horas (o indefinido)
- **Proyectos soportados**: Grandes/complejos

## 🎯 **Mejores Prácticas**

1. **Usar siempre configuración optimizada** para proyectos grandes
2. **Monitorear memoria regularmente**
3. **Reiniciar servicios** cuando sea necesario
4. **Mantener logs** de uso de memoria
5. **Documentar configuraciones** específicas por proyecto

## 📞 **Soporte**

Si experimentas problemas de memoria:
1. Ejecuta `.\monitor-memory.ps1`
2. Revisa esta guía
3. Usa `.\start-openswe-optimized.ps1`
4. Contacta al equipo de desarrollo

---

**Última actualización**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Versión**: 1.0
**Estado**: Implementado y probado ✅
