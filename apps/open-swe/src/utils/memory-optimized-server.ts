import { StateGraph, MemorySaver } from "@langchain/langgraph";
import { RedactingSerializer } from "./utils/redacting-serde.js";
import { startMemoryWatchdog } from "./utils/memory-watchdog.js";
import { MEMORY_OPTIMIZATION_FLAGS, validateMemoryConfig, getSerializerConfig } from "./utils/memory-config.js";
import { createLogger, LogLevel } from "./utils/logger.js";

const logger = createLogger(LogLevel.INFO, "MemoryOptimizedServer");

// Inicializar optimizaciones de memoria
export function initializeMemoryOptimizations() {
  logger.info("Initializing memory optimizations", {
    redactingSerde: MEMORY_OPTIMIZATION_FLAGS.LG_REDACTING_SERDE,
    memWatchdog: MEMORY_OPTIMIZATION_FLAGS.LG_MEM_WATCHDOG,
    useWorkers: MEMORY_OPTIMIZATION_FLAGS.LG_USE_WORKERS,
    streamJson: MEMORY_OPTIMIZATION_FLAGS.LG_STREAM_JSON,
    maxHeapSize: MEMORY_OPTIMIZATION_FLAGS.LG_MAX_HEAP_SIZE
  });

  // Validar configuración
  if (!validateMemoryConfig()) {
    logger.warn("Memory configuration validation failed");
  }

  // Iniciar watchdog de memoria si está habilitado
  if (MEMORY_OPTIMIZATION_FLAGS.LG_MEM_WATCHDOG) {
    startMemoryWatchdog();
    logger.info("Memory watchdog started");
  }

  // Configurar serializer redactor si está habilitado
  let checkpointer: MemorySaver | undefined;
  
  if (MEMORY_OPTIMIZATION_FLAGS.LG_REDACTING_SERDE) {
    const serializerConfig = getSerializerConfig();
    const serializer = new RedactingSerializer(serializerConfig);
    checkpointer = new MemorySaver(serializer);
    
    logger.info("Redacting serializer configured", serializerConfig);
  }

  return { checkpointer };
}

// Función para crear un grafo optimizado
export function createOptimizedGraph<T>(config: {
  state: any;
  nodes: any;
  edges: any;
  name?: string;
}) {
  const { checkpointer } = initializeMemoryOptimizations();
  
  const graph = new StateGraph<T>(config.state)
    .addNodes(config.nodes)
    .addEdges(config.edges);

  const compileOptions: any = {};
  
  if (checkpointer) {
    compileOptions.checkpointer = checkpointer;
    logger.info("Graph compiled with memory-optimized checkpointer");
  }

  return graph.compile(compileOptions);
}

// Función para invocar un grafo con optimizaciones
export async function invokeOptimizedGraph<T>(
  graph: any,
  input: any,
  options: {
    threadId?: string;
    configurable?: any;
  } = {}
) {
  const { threadId = `thread-${Date.now()}`, configurable = {} } = options;
  
  logger.info("Invoking optimized graph", { 
    threadId,
    hasCheckpointer: !!graph.checkpointer 
  });

  try {
    const result = await graph.invoke(input, {
      configurable: {
        thread_id: threadId,
        ...configurable
      }
    });

    logger.info("Graph invocation completed successfully", { threadId });
    return result;
  } catch (error) {
    logger.error("Graph invocation failed", { threadId, error });
    throw error;
  }
}

// Función para limpiar recursos de memoria
export function cleanupMemoryResources() {
  if ((global as any).gc) {
    (global as any).gc();
    logger.info("Garbage collection triggered");
  }
}

// Función para obtener métricas de memoria
export function getMemoryMetrics() {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const usageRatio = memUsage.heapTotal > 0 ? memUsage.heapUsed / memUsage.heapTotal : 0;

  return {
    heapUsed: heapUsedMB,
    heapTotal: heapTotalMB,
    usageRatio: Math.round(usageRatio * 100),
    external: Math.round(memUsage.external / 1024 / 1024),
    rss: Math.round(memUsage.rss / 1024 / 1024)
  };
}
