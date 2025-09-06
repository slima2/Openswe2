#!/bin/bash
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
