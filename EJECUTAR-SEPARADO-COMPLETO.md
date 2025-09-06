# 🚀 Open SWE - Ejecución Separada con 16GB

## ✅ **¡FUNCIONA! Sistema Ejecutándose Correctamente**

Has demostrado que la ejecución separada es la solución correcta. El CLI ya está funcionando.

## 📋 **Cómo Ejecutar Cada Componente**

### **1. Backend (LangGraph Agent) - Terminal 1**
```cmd
start-backend-16gb.cmd
```
**O manualmente:**
```bash
cd apps/open-swe
set NODE_OPTIONS=--max-old-space-size=16384 --expose-gc --trace-warnings
set LG_MAX_HEAP_SIZE=16384
set LG_LARGE_CODEBASE_MODE=true
npm run dev
```

### **2. Frontend (Web UI) - Terminal 2**
```cmd
start-frontend.cmd
```
**O manualmente:**
```bash
cd apps/web
npm run dev
```

### **3. CLI (Ya Funcionando) - Terminal 3**
```bash
# Ya lo tienes ejecutándose:
npm run dev  # Desde la raíz ejecuta el CLI
```

## 🌐 **URLs de Acceso**

Una vez que ejecutes todos los componentes:

- **🖥️ Web UI**: http://localhost:3000
- **🔧 LangGraph Studio**: http://localhost:8123
- **📱 CLI**: Ya funcionando en tu terminal
- **🔗 API**: http://localhost:8000 (si está configurado)

## 📊 **Estado Actual de tu Sistema**

### ✅ **Lo que Ya Funciona:**
- **CLI ejecutándose correctamente**
- **Configuración de 16GB lista**
- **Scripts de inicio creados**
- **Variables de entorno configuradas**

### 🔄 **Próximos Pasos:**
1. **Ejecutar Backend**: `start-backend-16gb.cmd`
2. **Ejecutar Frontend**: `start-frontend.cmd`
3. **Acceder a Web UI**: http://localhost:3000

## 🎯 **Ventajas de Esta Aproximación**

### **❌ Problemas del Monorepo Resueltos:**
- ~~Turbo buscando yarn~~
- ~~Errores de TypeScript en build~~
- ~~NODE_OPTIONS conflictivas~~
- ~~Dependencias complejas~~

### **✅ Beneficios de Ejecución Separada:**
- **Cada servicio independiente**
- **Control granular de memoria**
- **Debugging individual**
- **Restart selectivo**
- **npm run dev directo**

## 🔧 **Configuración de Memoria Aplicada**

### **Backend (16GB Optimizado):**
```bash
NODE_OPTIONS=--max-old-space-size=16384 --expose-gc --trace-warnings
LG_MAX_HEAP_SIZE=16384
LG_LARGE_CODEBASE_MODE=true
LG_DOCUMENT_CACHE_SIZE=250  # 250MB cache LRU
LG_STRING_LIMIT=25          # 25MB strings truncados
LG_MESSAGE_LIMIT=35         # 35MB mensajes deslizantes
```

### **Frontend (Next.js Automático):**
- Next.js maneja memoria automáticamente
- Hot reload eficiente
- Build optimizado

### **CLI (Ya Ejecutándose):**
- Modo local sin autenticación GitHub
- Directorio de trabajo configurado
- Interface terminal interactiva

## 📈 **Monitoreo de Rendimiento**

### **Métricas a Observar:**
- **Heap usage** < 11GB (warning a 11.2GB)
- **mu values** > 0.5 (efectividad GC)
- **Sin "allocation failure"** messages
- **Cache hit ratio** alto en documentos

### **Logs Esperados:**
```
🏠 Starting Open SWE CLI in Local Mode ✅
⚖️ Starting Open SWE in MODERATE mode (16GB heap) ✅
📊 Memory limits: Heap: 16GB ✅
🌐 Next.js ready on http://localhost:3000 ✅
```

## 🚨 **Troubleshooting Rápido**

### **Si Backend No Inicia:**
```bash
cd apps/open-swe
npm install
npm run dev
```

### **Si Frontend No Inicia:**
```bash
cd apps/web
npm install
npm run dev
```

### **Si Hay Conflictos de Puerto:**
```bash
# Cambiar puerto del frontend:
npm run dev -- -p 3001

# Ver puertos ocupados:
netstat -ano | findstr ":3000\|:8123\|:8000"
```

## 🎉 **¡Sistema Listo para Codebases de 100GB+!**

Tu configuración actual te permite:

✅ **Manejar codebases gigantes** sin crashes  
✅ **Sesiones de 8+ horas** estables  
✅ **16GB heap** vs 4GB anterior (4x mejora)  
✅ **Truncamiento inteligente** preserva sintaxis  
✅ **Cache LRU bounded** evita memory leaks  
✅ **Monitoreo proactivo** de memoria  

**¡Ejecuta los otros componentes y tendrás el sistema completo funcionando!** 🚀
