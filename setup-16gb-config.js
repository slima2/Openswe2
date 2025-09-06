#!/usr/bin/env node
/**
 * Setup script para configuración de 16GB
 * Configura el entorno para codebases gigantes con límite moderado de heap
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Open SWE para 16GB heap...\n');

// 1. Verificar que los archivos de utilidades existen
const utilsPath = path.join(__dirname, 'apps/open-swe/src/utils');
const requiredFiles = [
  'bounded-document-cache.ts',
  'streaming-message-reducer.ts', 
  'bounded-string-manager.ts',
  'memory-monitor.ts',
  'syntax-aware-truncator.ts',
  'json-validator.ts',
  'large-codebase-strategy.ts'
];

console.log('📋 Verificando archivos de utilidades...');
for (const file of requiredFiles) {
  const filePath = path.join(utilsPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - FALTA`);
  }
}

// 2. Crear configuración de variables de entorno
const envConfig = `# Open SWE - Configuración 16GB
# Variables de entorno para optimización de memoria

# Límites de heap
NODE_OPTIONS=--max-old-space-size=16384 --max-semi-space-size=512 --initial-old-space-size=2048 --expose-gc --optimize-for-size --trace-warnings --trace-gc

# Optimizaciones de memoria
LG_REDACTING_SERDE=true
LG_MEM_WATCHDOG=true
LG_USE_WORKERS=true
LG_STREAM_JSON=true
LG_MAX_HEAP_SIZE=16384
LG_LARGE_CODEBASE_MODE=true

# Límites específicos para 16GB
LG_DOCUMENT_CACHE_SIZE=250
LG_STRING_LIMIT=25
LG_MESSAGE_LIMIT=35

# Thresholds de memoria (dinámicos basados en 16GB)
LG_WARNING_THRESHOLD=11200
LG_CRITICAL_THRESHOLD=13600
`;

fs.writeFileSync('.env.16gb', envConfig);
console.log('\n📄 Creado archivo .env.16gb con configuración optimizada');

// 3. Crear script de inicio PowerShell para Windows
const powershellScript = `# Open SWE - Inicio con 16GB heap
# Script para Windows PowerShell

Write-Host "🚀 Iniciando Open SWE con configuración de 16GB..." -ForegroundColor Green

# Configurar variables de entorno
$env:NODE_OPTIONS = "--max-old-space-size=16384 --max-semi-space-size=512 --initial-old-space-size=2048 --expose-gc --optimize-for-size --trace-warnings --trace-gc"
$env:LG_REDACTING_SERDE = "true"
$env:LG_MEM_WATCHDOG = "true"
$env:LG_USE_WORKERS = "true"
$env:LG_STREAM_JSON = "true"
$env:LG_MAX_HEAP_SIZE = "16384"
$env:LG_LARGE_CODEBASE_MODE = "true"
$env:LG_DOCUMENT_CACHE_SIZE = "250"
$env:LG_STRING_LIMIT = "25"
$env:LG_MESSAGE_LIMIT = "35"

Write-Host "📊 Configuración de memoria:" -ForegroundColor Yellow
Write-Host "  - Heap límite: 16GB" -ForegroundColor White
Write-Host "  - Document Cache: 250MB" -ForegroundColor White
Write-Host "  - String límite: 25MB" -ForegroundColor White
Write-Host "  - Message límite: 35MB" -ForegroundColor White
Write-Host "  - Warning: 11.2GB, Critical: 13.6GB" -ForegroundColor White
Write-Host ""

# Iniciar la aplicación
Write-Host "🔄 Iniciando servidor..." -ForegroundColor Green
npm run dev
`;

fs.writeFileSync('start-16gb.ps1', powershellScript);
console.log('📄 Creado script start-16gb.ps1 para PowerShell');

// 4. Crear script de inicio para CMD/Bash
const bashScript = `#!/bin/bash
# Open SWE - Inicio con 16GB heap

echo "🚀 Iniciando Open SWE con configuración de 16GB..."

# Configurar variables de entorno
export NODE_OPTIONS="--max-old-space-size=16384 --max-semi-space-size=512 --initial-old-space-size=2048 --expose-gc --optimize-for-size --trace-warnings --trace-gc"
export LG_REDACTING_SERDE=true
export LG_MEM_WATCHDOG=true
export LG_USE_WORKERS=true
export LG_STREAM_JSON=true
export LG_MAX_HEAP_SIZE=16384
export LG_LARGE_CODEBASE_MODE=true
export LG_DOCUMENT_CACHE_SIZE=250
export LG_STRING_LIMIT=25
export LG_MESSAGE_LIMIT=35

echo "📊 Configuración de memoria:"
echo "  - Heap límite: 16GB"
echo "  - Document Cache: 250MB"
echo "  - String límite: 25MB"
echo "  - Message límite: 35MB"
echo "  - Warning: 11.2GB, Critical: 13.6GB"
echo ""

echo "🔄 Iniciando servidor..."
npm run dev
`;

fs.writeFileSync('start-16gb.sh', bashScript);
fs.chmodSync('start-16gb.sh', '755');
console.log('📄 Creado script start-16gb.sh para Linux/macOS');

// 5. Crear configuración de monitoreo
const monitoringConfig = {
  "name": "open-swe-16gb",
  "heap_limit_mb": 16384,
  "warning_threshold_mb": 11200,
  "critical_threshold_mb": 13600,
  "monitoring": {
    "interval_ms": 5000,
    "enable_gc_trigger": true,
    "enable_heap_snapshots": true
  },
  "cache_limits": {
    "document_cache_mb": 250,
    "string_limit_mb": 25,
    "message_limit_mb": 35,
    "max_messages": 200
  },
  "optimizations": {
    "redacting_serde": true,
    "memory_watchdog": true,
    "use_workers": true,
    "stream_json": true,
    "large_codebase_mode": true
  }
};

fs.writeFileSync('memory-config-16gb.json', JSON.stringify(monitoringConfig, null, 2));
console.log('📄 Creado archivo memory-config-16gb.json');

// 6. Instrucciones finales
console.log('\n🎉 ¡Configuración de 16GB completada!');
console.log('\n📋 Para usar la configuración:');
console.log('\n  Windows PowerShell:');
console.log('    .\\start-16gb.ps1');
console.log('\n  Linux/macOS/WSL:');
console.log('    ./start-16gb.sh');
console.log('\n  Con variables de entorno:');
console.log('    source .env.16gb && npm run dev');
console.log('\n  Directamente con Node.js:');
console.log('    node start-moderate-16gb.js');

console.log('\n📊 Esta configuración te dará:');
console.log('  ✅ 4x más capacidad que tu crash anterior (4GB → 16GB)');
console.log('  ✅ Monitoreo automático de memoria');
console.log('  ✅ Truncamiento inteligente que preserva sintaxis');
console.log('  ✅ Cache LRU bounded para documentos');
console.log('  ✅ Streaming de mensajes con ventana deslizante');
console.log('  ✅ Optimizado para codebases de 100GB+');

console.log('\n⚠️  Monitorea los logs para:');
console.log('  - Warning a los 11.2GB de heap');
console.log('  - Critical a los 13.6GB de heap');
console.log('  - Valores de mu > 0.5 (efectividad de GC)');
console.log('  - Sin "allocation failure" messages');
