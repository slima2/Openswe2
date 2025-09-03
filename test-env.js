// Script para verificar las variables de entorno
import { getLocalWorkingDirectory, isLocalModeFromEnv } from "@open-swe/shared/open-swe/local-mode";

console.log("=== Verificación de Variables de Entorno ===");
console.log("OPEN_SWE_LOCAL_MODE:", process.env.OPEN_SWE_LOCAL_MODE);
console.log("OPEN_SWE_LOCAL_PROJECT_PATH:", process.env.OPEN_SWE_LOCAL_PROJECT_PATH);
console.log("OPEN_SWE_PROJECT_PATH:", process.env.OPEN_SWE_PROJECT_PATH);
console.log("Platform:", process.platform);

console.log("\n=== Funciones de Local Mode ===");
console.log("isLocalModeFromEnv():", isLocalModeFromEnv());
console.log("getLocalWorkingDirectory():", getLocalWorkingDirectory());
console.log("getLocalWorkingDirectory('test-project'):", getLocalWorkingDirectory('test-project'));
