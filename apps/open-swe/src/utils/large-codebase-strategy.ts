import { createLogger, LogLevel } from "./logger.js";

const logger = createLogger(LogLevel.INFO, "LargeCodebaseStrategy");

/**
 * Estrategias específicas para codebases gigantes (100GB+)
 * Optimizado para sistemas con 64GB+ RAM
 */

export interface LargeCodebaseConfig {
  // Thresholds específicos para repos gigantes
  maxCodebaseTreeSize: number;
  intelligentSampling: boolean;
  priorityFilePatterns: string[];
  excludePatterns: string[];
  
  // Estrategias de summarización
  useHierarchicalSummary: boolean;
  maxDepthLevels: number;
  samplingRatio: number;
}

export const LARGE_CODEBASE_CONFIG: LargeCodebaseConfig = {
  maxCodebaseTreeSize: 100 * 1024 * 1024, // 100MB para el árbol completo
  intelligentSampling: true,
  priorityFilePatterns: [
    // Source code files
    '**/*.{ts,tsx,js,jsx,py,java,cpp,c,h,cs,go,rs}',
    // Configuration files
    '**/package.json',
    '**/tsconfig.json', 
    '**/Dockerfile',
    '**/.env*',
    '**/README*',
    '**/CHANGELOG*',
    // Build files
    '**/Makefile',
    '**/CMakeLists.txt',
    '**/build.gradle',
    '**/pom.xml',
  ],
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/target/**',
    '**/.git/**',
    '**/coverage/**',
    '**/*.log',
    '**/tmp/**',
    '**/cache/**',
    '**/*.min.js',
    '**/*.bundle.js',
  ],
  useHierarchicalSummary: true,
  maxDepthLevels: 5, // Solo 5 niveles de profundidad
  samplingRatio: 0.1, // Muestrear 10% de archivos no críticos
};

/**
 * Summarización jerárquica para codebases gigantes
 */
export function summarizeGiantCodebase(
  fullTree: string,
  config: LargeCodebaseConfig = LARGE_CODEBASE_CONFIG
): string {
  logger.info("Summarizing giant codebase", {
    originalSize: Buffer.byteLength(fullTree, 'utf8'),
    maxSize: config.maxCodebaseTreeSize,
  });

  const lines = fullTree.split('\n');
  
  if (!config.intelligentSampling) {
    // Fallback simple: primeras y últimas líneas
    return simpleTreeSummary(lines, config.maxCodebaseTreeSize);
  }

  // Estrategia inteligente para repos gigantes
  return intelligentTreeSummary(lines, config);
}

/**
 * Summarización inteligente que preserva estructura importante
 */
function intelligentTreeSummary(
  lines: string[],
  config: LargeCodebaseConfig
): string {
  const result: string[] = [];
  const stats = {
    totalFiles: 0,
    importantFiles: 0,
    sampledFiles: 0,
    excludedFiles: 0,
  };

  // Análisis por niveles de directorio
  const directoryLevels = new Map<number, string[]>();
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    stats.totalFiles++;
    
    // Calcular nivel de profundidad
    const depth = (line.match(/[│├└]/g) || []).length;
    
    if (depth > config.maxDepthLevels) {
      stats.excludedFiles++;
      continue; // Skip archivos muy profundos
    }

    // Verificar si debe ser excluido
    if (shouldExcludeFile(line, config.excludePatterns)) {
      stats.excludedFiles++;
      continue;
    }

    // Verificar si es archivo prioritario
    if (isPriorityFile(line, config.priorityFilePatterns)) {
      if (!directoryLevels.has(depth)) {
        directoryLevels.set(depth, []);
      }
      directoryLevels.get(depth)!.push(line);
      stats.importantFiles++;
      continue;
    }

    // Muestreo para archivos no críticos
    if (Math.random() < config.samplingRatio) {
      if (!directoryLevels.has(depth)) {
        directoryLevels.set(depth, []);
      }
      directoryLevels.get(depth)!.push(line);
      stats.sampledFiles++;
    }
  }

  // Construir resumen jerárquico
  result.push(`[GIANT CODEBASE SUMMARY - ${stats.totalFiles} total files]`);
  result.push(`Important: ${stats.importantFiles}, Sampled: ${stats.sampledFiles}, Excluded: ${stats.excludedFiles}`);
  result.push('');

  // Agregar por niveles de profundidad
  for (let level = 0; level <= config.maxDepthLevels; level++) {
    const levelFiles = directoryLevels.get(level);
    if (levelFiles && levelFiles.length > 0) {
      result.push(`--- LEVEL ${level} ---`);
      
      // Limitar archivos por nivel para controlar tamaño
      const maxFilesPerLevel = Math.max(50, Math.floor(1000 / (level + 1)));
      const filesToInclude = levelFiles.slice(0, maxFilesPerLevel);
      
      result.push(...filesToInclude);
      
      if (levelFiles.length > maxFilesPerLevel) {
        result.push(`... and ${levelFiles.length - maxFilesPerLevel} more files at this level`);
      }
      result.push('');
    }
  }

  const summary = result.join('\n');
  const finalSize = Buffer.byteLength(summary, 'utf8');

  logger.info("Giant codebase summary completed", {
    ...stats,
    finalSizeBytes: finalSize,
    compressionRatio: finalSize / Buffer.byteLength(lines.join('\n'), 'utf8'),
  });

  // Si aún es muy grande, aplicar truncamiento final
  if (finalSize > config.maxCodebaseTreeSize) {
    return truncateToSize(summary, config.maxCodebaseTreeSize);
  }

  return summary;
}

/**
 * Verificar si un archivo debe ser excluido
 */
function shouldExcludeFile(line: string, excludePatterns: string[]): boolean {
  const fileName = extractFileName(line);
  if (!fileName) return false;

  return excludePatterns.some(pattern => {
    // Convertir glob pattern a regex simple
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    
    return new RegExp(regex, 'i').test(fileName);
  });
}

/**
 * Verificar si es un archivo prioritario
 */
function isPriorityFile(line: string, priorityPatterns: string[]): boolean {
  const fileName = extractFileName(line);
  if (!fileName) return false;

  return priorityPatterns.some(pattern => {
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.')
      .replace(/\{([^}]+)\}/g, '($1)');
    
    return new RegExp(regex, 'i').test(fileName);
  });
}

/**
 * Extraer nombre de archivo de una línea del árbol
 */
function extractFileName(line: string): string | null {
  // Remover caracteres del árbol (│, ├, └, etc.)
  const cleaned = line.replace(/[│├└─\s]/g, '');
  if (!cleaned) return null;
  
  // Obtener solo el nombre del archivo/directorio
  const parts = cleaned.split('/');
  return parts[parts.length - 1] || cleaned;
}

/**
 * Summarización simple como fallback
 */
function simpleTreeSummary(lines: string[], maxSize: number): string {
  const maxLines = Math.floor(maxSize / 50); // Estimado 50 bytes por línea
  
  if (lines.length <= maxLines) {
    return lines.join('\n');
  }

  const keepStart = Math.floor(maxLines * 0.4);
  const keepEnd = Math.floor(maxLines * 0.4);
  const keepMiddle = maxLines - keepStart - keepEnd;

  const result = [
    ...lines.slice(0, keepStart),
    `... [TRUNCATED: ${lines.length - maxLines} lines omitted] ...`,
    ...lines.slice(Math.floor(lines.length / 2), Math.floor(lines.length / 2) + keepMiddle),
    `... [TRUNCATED: continuing to end] ...`,
    ...lines.slice(-keepEnd),
  ];

  return result.join('\n');
}

/**
 * Truncar a tamaño específico manteniendo estructura
 */
function truncateToSize(content: string, maxSize: number): string {
  if (Buffer.byteLength(content, 'utf8') <= maxSize) {
    return content;
  }

  const lines = content.split('\n');
  const targetLines = Math.floor(maxSize / 50); // Estimado

  if (lines.length <= targetLines) {
    return content;
  }

  const keepLines = lines.slice(0, targetLines - 1);
  keepLines.push(`[TRUNCATED - Original had ${lines.length} lines, showing first ${targetLines - 1}]`);

  return keepLines.join('\n');
}

/**
 * Configurar estrategia para codebase específico
 */
export function configureForGiantCodebase(overrides: Partial<LargeCodebaseConfig>): LargeCodebaseConfig {
  return { ...LARGE_CODEBASE_CONFIG, ...overrides };
}

/**
 * Obtener estadísticas de un codebase
 */
export function analyzeCodebaseSize(tree: string): {
  totalLines: number;
  estimatedFiles: number;
  estimatedDirectories: number;
  maxDepth: number;
  sizeBytes: number;
} {
  const lines = tree.split('\n').filter(line => line.trim());
  
  let maxDepth = 0;
  let files = 0;
  let directories = 0;

  for (const line of lines) {
    const depth = (line.match(/[│├└]/g) || []).length;
    maxDepth = Math.max(maxDepth, depth);
    
    // Heurística simple: si termina en extensión, es archivo
    if (/\.[a-zA-Z0-9]+$/.test(line.trim())) {
      files++;
    } else {
      directories++;
    }
  }

  return {
    totalLines: lines.length,
    estimatedFiles: files,
    estimatedDirectories: directories,
    maxDepth,
    sizeBytes: Buffer.byteLength(tree, 'utf8'),
  };
}
