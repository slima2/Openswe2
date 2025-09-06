@echo off
echo === OPEN SWE - CONFIGURACION 16GB ===
echo.

echo Configurando variables de entorno...
set NODE_OPTIONS=--max-old-space-size=16384 --max-semi-space-size=512 --initial-old-space-size=2048 --expose-gc --optimize-for-size --trace-warnings --trace-gc
set LG_REDACTING_SERDE=true
set LG_MEM_WATCHDOG=true
set LG_USE_WORKERS=true
set LG_STREAM_JSON=true
set LG_MAX_HEAP_SIZE=16384
set LG_LARGE_CODEBASE_MODE=true
set LG_DOCUMENT_CACHE_SIZE=250
set LG_STRING_LIMIT=25
set LG_MESSAGE_LIMIT=35

echo.
echo CONFIGURACION:
echo   - Heap limite: 16GB
echo   - Document Cache: 250MB
echo   - String limite: 25MB
echo   - Message limite: 35MB
echo   - Optimizaciones: TODAS ACTIVADAS
echo.

echo Verificando Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js no encontrado
    pause
    exit /b 1
)

echo.
echo Iniciando servidor...
echo.

REM Intentar diferentes formas de ejecutar
if exist "start-moderate-16gb.js" (
    echo Usando start-moderate-16gb.js
    node start-moderate-16gb.js
) else if exist "apps\open-swe\dist\server.js" (
    echo Usando apps\open-swe\dist\server.js
    node apps\open-swe\dist\server.js
) else (
    echo Intentando npm run dev...
    npm run dev
)

pause
