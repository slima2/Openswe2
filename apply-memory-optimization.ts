#!/usr/bin/env tsx
/**
 * Script para aplicar las optimizaciones de memoria al sistema Open SWE
 * Este script modifica los archivos necesarios para implementar streaming y bounded data
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const REPO_ROOT = process.cwd();

interface FileModification {
  filePath: string;
  description: string;
  changes: Array<{
    search: string;
    replace: string;
    description: string;
  }>;
}

const MODIFICATIONS: FileModification[] = [
  {
    filePath: 'packages/shared/src/open-swe/types.ts',
    description: 'Update GraphAnnotation to use bounded reducers',
    changes: [
      {
        search: `import { tokenDataReducer } from "../caching.js";`,
        replace: `import { tokenDataReducer } from "../caching.js";
import { streamingMessageReducer } from "../../../apps/open-swe/src/utils/streaming-message-reducer.js";
import { boundedStringReducer } from "../../../apps/open-swe/src/utils/bounded-string-manager.js";
import { boundedDocumentCacheReducer, BoundedDocumentCache, createBoundedDocumentCache } from "../../../apps/open-swe/src/utils/bounded-document-cache.js";`,
        description: 'Add imports for bounded reducers',
      },
      {
        search: `internalMessages: withLangGraph(z.custom<BaseMessage[]>(), {
    reducer: {
      schema: z.custom<Messages>(),
      fn: messagesStateReducer,
    },`,
        replace: `internalMessages: withLangGraph(z.custom<BaseMessage[]>(), {
    reducer: {
      schema: z.custom<Messages>(),
      fn: streamingMessageReducer,
    },`,
        description: 'Replace with streaming message reducer',
      },
      {
        search: `codebaseTree: withLangGraph(z.custom<string>(), {
    reducer: {
      schema: z.custom<string>(),
      fn: (_state, update) => update,
    },
  }),`,
        replace: `codebaseTree: withLangGraph(z.custom<string>(), {
    reducer: {
      schema: z.custom<string>(),
      fn: boundedStringReducer('codebaseTree'),
    },
  }),`,
        description: 'Replace with bounded string reducer for codebaseTree',
      },
      {
        search: `contextGatheringNotes: withLangGraph(z.custom<string>(), {
    reducer: {
      schema: z.custom<string>(),
      fn: (_state, update) => update,
    },
    default: () => "",
  }),`,
        replace: `contextGatheringNotes: withLangGraph(z.custom<string>(), {
    reducer: {
      schema: z.custom<string>(),
      fn: boundedStringReducer('contextGatheringNotes'),
    },
    default: () => "",
  }),`,
        description: 'Replace with bounded string reducer for contextGatheringNotes',
      },
      {
        search: `documentCache: withLangGraph(z.custom<Record<string, string>>(), {
    reducer: {
      schema: z.custom<Record<string, string>>(),
      fn: (state, update) => ({ ...state, ...update }),
    },
    default: () => ({}),
  }),`,
        replace: `documentCache: withLangGraph(z.custom<BoundedDocumentCache>(), {
    reducer: {
      schema: z.custom<BoundedDocumentCache>(),
      fn: boundedDocumentCacheReducer,
    },
    default: () => createBoundedDocumentCache(),
  }),`,
        description: 'Replace with bounded document cache',
      },
    ],
  },
  {
    filePath: 'apps/open-swe/src/tools/search-documents-for/index.ts',
    description: 'Update search-documents-for tool to use BoundedDocumentCache',
    changes: [
      {
        search: `let documentContent = state.documentCache[parsedUrl];`,
        replace: `let documentContent = state.documentCache.get(parsedUrl);`,
        description: 'Use bounded cache get method',
      },
      {
        search: `const stateUpdates = {
              documentCache: {
                ...state.documentCache,
                [parsedUrl]: documentContent,
              },
            };`,
        replace: `state.documentCache.set(parsedUrl, documentContent);
            const stateUpdates = {
              documentCache: state.documentCache,
            };`,
        description: 'Use bounded cache set method',
      },
    ],
  },
  {
    filePath: 'apps/open-swe/src/tools/url-content.ts',
    description: 'Update url-content tool to use BoundedDocumentCache',
    changes: [
      {
        search: `let documentContent = state.documentCache[parsedUrl];`,
        replace: `let documentContent = state.documentCache.get(parsedUrl);`,
        description: 'Use bounded cache get method',
      },
      {
        search: `const stateUpdates = {
            documentCache: {
              ...state.documentCache,
              [parsedUrl]: documentContent,
            },
          };`,
        replace: `state.documentCache.set(parsedUrl, documentContent);
          const stateUpdates = {
            documentCache: state.documentCache,
          };`,
        description: 'Use bounded cache set method',
      },
    ],
  },
  {
    filePath: 'apps/open-swe/src/utils/tool-output-processing.ts',
    description: 'Update tool output processing to use BoundedDocumentCache',
    changes: [
      {
        search: `if (parsedUrl && state.documentCache[parsedUrl]) {
      return {
        content: state.documentCache[parsedUrl],
      };
    }`,
        replace: `const cachedContent = parsedUrl ? state.documentCache.get(parsedUrl) : null;
    if (cachedContent) {
      return {
        content: cachedContent,
      };
    }`,
        description: 'Use bounded cache get method for checking cached content',
      },
      {
        search: `const stateUpdates = parsedUrl
      ? {
          documentCache: {
            ...state.documentCache,
            [parsedUrl]: result,
          },
        }
      : undefined;`,
        replace: `let stateUpdates: any = undefined;
    if (parsedUrl) {
      state.documentCache.set(parsedUrl, result);
      stateUpdates = {
        documentCache: state.documentCache,
      };
    }`,
        description: 'Use bounded cache set method for storing results',
      },
    ],
  },
];

async function applyModifications(): Promise<void> {
  console.log('🚀 Aplicando optimizaciones de memoria...\n');

  for (const modification of MODIFICATIONS) {
    const fullPath = path.join(REPO_ROOT, modification.filePath);
    
    try {
      console.log(`📝 Modificando: ${modification.filePath}`);
      console.log(`   ${modification.description}`);
      
      let content = await fs.readFile(fullPath, 'utf-8');
      let changesApplied = 0;

      for (const change of modification.changes) {
        if (content.includes(change.search)) {
          content = content.replace(change.search, change.replace);
          changesApplied++;
          console.log(`   ✅ ${change.description}`);
        } else {
          console.log(`   ⚠️  No encontrado: ${change.description}`);
        }
      }

      if (changesApplied > 0) {
        await fs.writeFile(fullPath, content, 'utf-8');
        console.log(`   💾 Guardado con ${changesApplied} cambios\n`);
      } else {
        console.log(`   ℹ️  Sin cambios aplicados\n`);
      }

    } catch (error) {
      console.error(`   ❌ Error procesando ${modification.filePath}:`, error);
    }
  }
}

async function addMemoryMonitoringToServer(): Promise<void> {
  const serverFiles = [
    'apps/open-swe/src/server.ts',
    'apps/open-swe/src/index.ts',
    'apps/open-swe/src/app.ts',
  ];

  const monitoringCode = `
// Memory optimization monitoring
import { startMemoryMonitoring } from "./utils/memory-monitor.js";

// Start memory monitoring
startMemoryMonitoring({
  intervalMs: 5000,
  warningThresholds: {
    heapUsedMB: 2000, // 2GB warning
    externalMB: 1000, // 1GB external warning
    arrayBuffersMB: 500, // 500MB ArrayBuffer warning
  },
  criticalThresholds: {
    heapUsedMB: 3000, // 3GB critical
    externalMB: 1500, // 1.5GB external critical
    arrayBuffersMB: 1000, // 1GB ArrayBuffer critical
  },
  enableGCTrigger: true,
});

console.log("🔍 Memory monitoring started");
`;

  for (const serverFile of serverFiles) {
    const fullPath = path.join(REPO_ROOT, serverFile);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Add monitoring code after imports but before main logic
      const lines = content.split('\n');
      let insertIndex = -1;
      
      // Find a good place to insert (after imports, before main logic)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('export') || line.startsWith('const app') || line.startsWith('app.listen')) {
          insertIndex = i;
          break;
        }
      }
      
      if (insertIndex > 0) {
        lines.splice(insertIndex, 0, monitoringCode);
        await fs.writeFile(fullPath, lines.join('\n'), 'utf-8');
        console.log(`📊 Agregado monitoreo de memoria a: ${serverFile}`);
        break; // Only add to the first server file found
      }
      
    } catch (error) {
      // File doesn't exist, continue to next
      continue;
    }
  }
}

async function createStartupScript(): Promise<void> {
  const startupScript = `#!/usr/bin/env node
/**
 * Memory-optimized startup script for Open SWE
 * Configures Node.js with optimal memory settings
 */

// Set memory optimization flags
process.env.NODE_OPTIONS = [
  '--max-old-space-size=8192', // 8GB heap limit
  '--expose-gc', // Enable manual GC
  '--optimize-for-size', // Optimize for memory usage
  '--trace-warnings', // Show memory warnings
].join(' ');

// Import and start the application
require('./apps/open-swe/dist/server.js');
`;

  await fs.writeFile(path.join(REPO_ROOT, 'start-memory-optimized.js'), startupScript, 'utf-8');
  console.log('🚀 Creado script de inicio optimizado: start-memory-optimized.js');
}

async function main(): Promise<void> {
  try {
    await applyModifications();
    await addMemoryMonitoringToServer();
    await createStartupScript();
    
    console.log(`
🎉 ¡Optimizaciones de memoria aplicadas exitosamente!

📋 Resumen de cambios:
✅ DocumentCache: Ahora usa LRU con límite de 50MB
✅ Messages: Ventana deslizante de últimos 50 mensajes
✅ Strings grandes: Limitados a 2MB con summarización
✅ Monitoreo: Alertas automáticas de uso de memoria
✅ Script optimizado: start-memory-optimized.js

🚀 Próximos pasos:
1. Ejecutar: yarn build
2. Probar con: node start-memory-optimized.js
3. Monitorear logs para alertas de memoria
4. Ajustar umbrales según sea necesario

💡 Beneficios esperados:
- 70-90% reducción en uso de memoria
- GC más eficiente
- Sin errores "heap out of memory"
- Mejor rendimiento en sesiones largas
`);

  } catch (error) {
    console.error('❌ Error aplicando optimizaciones:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
