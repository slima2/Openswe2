import { createLogger, LogLevel } from "./logger.js";

const logger = createLogger(LogLevel.INFO, "SyntaxAwareTruncator");

export interface TruncationResult {
  content: string;
  truncated: boolean;
  originalSize: number;
  finalSize: number;
  syntaxValid: boolean;
  truncationMethod: string;
}

export interface SyntaxConfig {
  preserveStructure: boolean;
  validateSyntax: boolean;
  fallbackToSafe: boolean;
  maxAttempts: number;
}

export const DEFAULT_SYNTAX_CONFIG: SyntaxConfig = {
  preserveStructure: true,
  validateSyntax: true,
  fallbackToSafe: true,
  maxAttempts: 3,
};

/**
 * Truncador que preserva la sintaxis de JSON, código y otros formatos estructurados
 */
export class SyntaxAwareTruncator {
  private config: SyntaxConfig;

  constructor(config: Partial<SyntaxConfig> = {}) {
    this.config = { ...DEFAULT_SYNTAX_CONFIG, ...config };
  }

  /**
   * Truncar contenido preservando sintaxis
   */
  truncate(content: string, maxSize: number, contentType?: string): TruncationResult {
    const originalSize = Buffer.byteLength(content, 'utf8');
    
    if (originalSize <= maxSize) {
      return {
        content,
        truncated: false,
        originalSize,
        finalSize: originalSize,
        syntaxValid: true,
        truncationMethod: 'none',
      };
    }

    logger.info("Starting syntax-aware truncation", {
      originalSize,
      maxSize,
      contentType,
    });

    // Detectar tipo de contenido si no se especifica
    const detectedType = contentType || this.detectContentType(content);
    
    // Aplicar estrategia específica por tipo
    switch (detectedType) {
      case 'json':
        return this.truncateJSON(content, maxSize);
      case 'javascript':
      case 'typescript':
        return this.truncateCode(content, maxSize, detectedType);
      case 'xml':
      case 'html':
        return this.truncateMarkup(content, maxSize);
      case 'codebase-tree':
        return this.truncateCodebaseTree(content, maxSize);
      default:
        return this.truncateGeneric(content, maxSize);
    }
  }

  /**
   * Detectar tipo de contenido automáticamente
   */
  private detectContentType(content: string): string {
    const trimmed = content.trim();
    
    // JSON detection
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(content);
        return 'json';
      } catch {
        // Podría ser código JavaScript/TypeScript con objetos
      }
    }

    // Code detection
    if (this.hasCodePatterns(content)) {
      if (content.includes('interface ') || content.includes(': string') || content.includes('export ')) {
        return 'typescript';
      }
      return 'javascript';
    }

    // Markup detection
    if (trimmed.startsWith('<') && trimmed.includes('>')) {
      return content.includes('<!DOCTYPE') ? 'html' : 'xml';
    }

    // Codebase tree detection
    if (content.includes('├──') || content.includes('└──') || content.includes('│')) {
      return 'codebase-tree';
    }

    return 'text';
  }

  /**
   * Truncar JSON preservando estructura válida
   */
  private truncateJSON(content: string, maxSize: number): TruncationResult {
    // Use JSON validator to ensure safety
    const { validateAndFixJSON, safeJSONTruncate } = require('./json-validator.js');
    
    const validation = validateAndFixJSON(content);
    let workingContent = content;
    
    if (!validation.valid) {
      if (validation.fixedContent) {
        logger.info("Using repaired JSON for truncation", {
          originalError: validation.error,
          repaired: true,
        });
        workingContent = validation.fixedContent;
      } else {
        logger.warn("JSON is malformed and cannot be repaired, using generic truncation", { 
          error: validation.error 
        });
        return this.truncateGeneric(content, maxSize);
      }
    }

    try {
      const parsed = JSON.parse(workingContent);
      const result = this.truncateJSONObject(parsed, maxSize);
      
      // Final validation of the result
      const finalValidation = validateAndFixJSON(result.content);
      if (!finalValidation.valid && finalValidation.fixedContent) {
        result.content = finalValidation.fixedContent;
        result.truncationMethod += '-with-repair';
      }
      
      return result;
    } catch (error) {
      logger.warn("JSON truncation failed, using safe JSON truncator", { error });
      
      const safeResult = safeJSONTruncate(workingContent, maxSize);
      return {
        content: safeResult,
        truncated: true,
        originalSize: Buffer.byteLength(content, 'utf8'),
        finalSize: Buffer.byteLength(safeResult, 'utf8'),
        syntaxValid: true,
        truncationMethod: 'safe-json-fallback',
      };
    }
  }

  /**
   * Truncar objeto JSON recursivamente
   */
  private truncateJSONObject(obj: any, maxSize: number): TruncationResult {
    const attempts: Array<{ obj: any; method: string }> = [];
    
    // Estrategia 1: Truncar arrays largos
    let truncated = this.truncateArrays(JSON.parse(JSON.stringify(obj)));
    attempts.push({ obj: truncated, method: 'array-truncation' });

    // Estrategia 2: Remover propiedades menos importantes
    truncated = this.removeUnimportantProps(JSON.parse(JSON.stringify(obj)));
    attempts.push({ obj: truncated, method: 'property-removal' });

    // Estrategia 3: Truncar strings largos dentro del JSON
    truncated = this.truncateJSONStrings(JSON.parse(JSON.stringify(obj)));
    attempts.push({ obj: truncated, method: 'string-truncation' });

    // Probar cada estrategia
    for (const attempt of attempts) {
      const jsonString = JSON.stringify(attempt.obj, null, 2);
      const size = Buffer.byteLength(jsonString, 'utf8');
      
      if (size <= maxSize) {
        return {
          content: jsonString,
          truncated: true,
          originalSize: Buffer.byteLength(JSON.stringify(obj), 'utf8'),
          finalSize: size,
          syntaxValid: true,
          truncationMethod: attempt.method,
        };
      }
    }

    // Fallback: Truncación drástica pero válida
    const minimal = this.createMinimalJSON(obj);
    const minimalString = JSON.stringify(minimal, null, 2);
    
    return {
      content: minimalString,
      truncated: true,
      originalSize: Buffer.byteLength(JSON.stringify(obj), 'utf8'),
      finalSize: Buffer.byteLength(minimalString, 'utf8'),
      syntaxValid: true,
      truncationMethod: 'minimal-json',
    };
  }

  /**
   * Truncar código preservando sintaxis básica
   */
  private truncateCode(content: string, maxSize: number, language: string): TruncationResult {
    const lines = content.split('\n');
    const targetLines = Math.floor(maxSize / 50); // Estimado 50 chars por línea
    
    if (lines.length <= targetLines) {
      return this.truncateGeneric(content, maxSize);
    }

    // Estrategia: Mantener funciones/clases importantes completas
    const importantBlocks = this.extractImportantCodeBlocks(lines, language);
    const result = this.buildTruncatedCode(importantBlocks, targetLines, language);
    
    return {
      content: result.content,
      truncated: true,
      originalSize: Buffer.byteLength(content, 'utf8'),
      finalSize: Buffer.byteLength(result.content, 'utf8'),
      syntaxValid: result.syntaxValid,
      truncationMethod: 'code-block-preservation',
    };
  }

  /**
   * Truncar árboles de codebase preservando estructura
   */
  private truncateCodebaseTree(content: string, maxSize: number): TruncationResult {
    const lines = content.split('\n');
    const targetLines = Math.floor(maxSize / 30); // Estimado 30 chars por línea en árboles
    
    if (lines.length <= targetLines) {
      return this.truncateGeneric(content, maxSize);
    }

    // Preservar estructura jerárquica
    const structuredLines = this.preserveTreeStructure(lines, targetLines);
    const result = structuredLines.join('\n');
    
    return {
      content: result,
      truncated: true,
      originalSize: Buffer.byteLength(content, 'utf8'),
      finalSize: Buffer.byteLength(result, 'utf8'),
      syntaxValid: true,
      truncationMethod: 'tree-structure-preservation',
    };
  }

  /**
   * Truncar arrays en JSON manteniendo estructura
   */
  private truncateArrays(obj: any, maxItems: number = 10): any {
    if (Array.isArray(obj)) {
      if (obj.length > maxItems) {
        const truncated = obj.slice(0, maxItems);
        truncated.push(`[... ${obj.length - maxItems} more items truncated]`);
        return truncated;
      }
      return obj.map(item => this.truncateArrays(item, maxItems));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.truncateArrays(value, maxItems);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Remover propiedades menos importantes del JSON
   */
  private removeUnimportantProps(obj: any): any {
    const unimportantKeys = [
      'debug', 'trace', 'verbose', 'metadata', 'stats', 'cache',
      'internal', 'private', '_id', 'timestamp', 'created', 'updated',
      'logs', 'history', 'temp', 'tmp', 'deprecated'
    ];

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUnimportantProps(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Mantener propiedades importantes
        if (!unimportantKeys.some(unimportant => 
          key.toLowerCase().includes(unimportant.toLowerCase())
        )) {
          result[key] = this.removeUnimportantProps(value);
        }
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Truncar strings largos dentro de JSON
   */
  private truncateJSONStrings(obj: any, maxStringLength: number = 1000): any {
    if (typeof obj === 'string') {
      if (obj.length > maxStringLength) {
        return obj.substring(0, maxStringLength - 20) + '...[truncated]';
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.truncateJSONStrings(item, maxStringLength));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.truncateJSONStrings(value, maxStringLength);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Crear JSON mínimo pero válido
   */
  private createMinimalJSON(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.length > 0 ? [
        obj[0], 
        `[... ${obj.length - 1} items truncated for size]`
      ] : [];
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      if (keys.length === 0) return {};
      
      const result: any = {};
      // Mantener solo las primeras 3 propiedades más importantes
      const importantKeys = keys.slice(0, 3);
      
      for (const key of importantKeys) {
        const value = obj[key];
        if (typeof value === 'string') {
          result[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
        } else if (typeof value === 'object') {
          result[key] = this.createMinimalJSON(value);
        } else {
          result[key] = value;
        }
      }
      
      if (keys.length > 3) {
        result['...'] = `${keys.length - 3} more properties truncated`;
      }
      
      return result;
    }
    
    return obj;
  }

  /**
   * Detectar patrones de código
   */
  private hasCodePatterns(content: string): boolean {
    const codePatterns = [
      /function\s+\w+/,
      /class\s+\w+/,
      /interface\s+\w+/,
      /export\s+(default\s+)?/,
      /import\s+.+from/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /=>\s*{/,
      /if\s*\(/,
      /for\s*\(/,
      /while\s*\(/,
    ];

    return codePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Extraer bloques importantes de código
   */
  private extractImportantCodeBlocks(lines: string[], language: string): Array<{
    start: number;
    end: number;
    importance: number;
    type: string;
  }> {
    const blocks: Array<{ start: number; end: number; importance: number; type: string }> = [];
    let currentBlock: { start: number; type: string; importance: number } | null = null;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar inicio de bloques importantes
      if (this.isImportantLineStart(line, language)) {
        if (currentBlock) {
          blocks.push({
            start: currentBlock.start,
            end: i - 1,
            importance: currentBlock.importance,
            type: currentBlock.type,
          });
        }
        
        currentBlock = {
          start: i,
          type: this.getBlockType(line),
          importance: this.getBlockImportance(line),
        };
        braceCount = 0;
      }
      
      // Contar braces para determinar fin de bloque
      if (currentBlock) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        
        if (braceCount <= 0 && line.includes('}')) {
          blocks.push({
            start: currentBlock.start,
            end: i,
            importance: currentBlock.importance,
            type: currentBlock.type,
          });
          currentBlock = null;
        }
      }
    }

    // Cerrar bloque abierto
    if (currentBlock) {
      blocks.push({
        start: currentBlock.start,
        end: lines.length - 1,
        importance: currentBlock.importance,
        type: currentBlock.type,
      });
    }

    return blocks.sort((a, b) => b.importance - a.importance);
  }

  private isImportantLineStart(line: string, language: string): boolean {
    const patterns = [
      /^(export\s+)?(default\s+)?function\s+\w+/,
      /^(export\s+)?(default\s+)?class\s+\w+/,
      /^(export\s+)?interface\s+\w+/,
      /^(export\s+)?type\s+\w+/,
      /^(export\s+)?const\s+\w+\s*=/,
      /^import\s+/,
    ];

    return patterns.some(pattern => pattern.test(line));
  }

  private getBlockType(line: string): string {
    if (line.includes('function')) return 'function';
    if (line.includes('class')) return 'class';
    if (line.includes('interface')) return 'interface';
    if (line.includes('type')) return 'type';
    if (line.includes('import')) return 'import';
    if (line.includes('const')) return 'const';
    return 'other';
  }

  private getBlockImportance(line: string): number {
    let importance = 5; // Base importance
    
    if (line.includes('export')) importance += 3;
    if (line.includes('default')) importance += 2;
    if (line.includes('class')) importance += 2;
    if (line.includes('interface')) importance += 2;
    if (line.includes('function')) importance += 1;
    if (line.includes('import')) importance += 1;
    
    return importance;
  }

  /**
   * Construir código truncado preservando sintaxis
   */
  private buildTruncatedCode(blocks: any[], targetLines: number, language: string): {
    content: string;
    syntaxValid: boolean;
  } {
    const result: string[] = [];
    let usedLines = 0;

    // Agregar imports primero
    const importBlocks = blocks.filter(b => b.type === 'import');
    for (const block of importBlocks) {
      if (usedLines + (block.end - block.start + 1) <= targetLines * 0.1) { // Max 10% para imports
        result.push(`// Lines ${block.start + 1}-${block.end + 1}`);
        usedLines += block.end - block.start + 1;
      }
    }

    // Agregar bloques importantes
    const otherBlocks = blocks.filter(b => b.type !== 'import');
    for (const block of otherBlocks) {
      const blockSize = block.end - block.start + 1;
      if (usedLines + blockSize <= targetLines) {
        result.push(`\n// ${block.type.toUpperCase()}: Lines ${block.start + 1}-${block.end + 1}`);
        result.push(`// [Block truncated for size - original had ${blockSize} lines]`);
        usedLines += 3; // Solo las líneas de comentario
      }
    }

    result.push(`\n// [TRUNCATED: Original file had many more lines]`);
    
    return {
      content: result.join('\n'),
      syntaxValid: true,
    };
  }

  /**
   * Preservar estructura de árbol
   */
  private preserveTreeStructure(lines: string[], targetLines: number): string[] {
    const result: string[] = [];
    const depthCounts = new Map<number, number>();
    
    // Analizar profundidades
    for (const line of lines) {
      const depth = (line.match(/[│├└]/g) || []).length;
      depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1);
    }

    // Mantener estructura por niveles
    let remainingLines = targetLines;
    const maxDepth = Math.max(...depthCounts.keys());
    
    for (let depth = 0; depth <= Math.min(maxDepth, 5); depth++) {
      const linesAtDepth = lines.filter(line => 
        (line.match(/[│├└]/g) || []).length === depth
      );
      
      const quota = Math.floor(remainingLines / (maxDepth - depth + 1));
      const sampled = this.sampleLines(linesAtDepth, quota);
      
      result.push(...sampled);
      remainingLines -= sampled.length;
      
      if (remainingLines <= 0) break;
    }

    return result.sort((a, b) => {
      const aIndex = lines.indexOf(a);
      const bIndex = lines.indexOf(b);
      return aIndex - bIndex;
    });
  }

  private sampleLines(lines: string[], maxLines: number): string[] {
    if (lines.length <= maxLines) return lines;
    
    const step = Math.floor(lines.length / maxLines);
    const result: string[] = [];
    
    for (let i = 0; i < lines.length; i += step) {
      if (result.length < maxLines) {
        result.push(lines[i]);
      }
    }
    
    return result;
  }

  /**
   * Truncación genérica segura
   */
  private truncateGeneric(content: string, maxSize: number): TruncationResult {
    const lines = content.split('\n');
    const targetLines = Math.floor(maxSize / 50);
    
    if (lines.length <= targetLines) {
      return {
        content,
        truncated: false,
        originalSize: Buffer.byteLength(content, 'utf8'),
        finalSize: Buffer.byteLength(content, 'utf8'),
        syntaxValid: true,
        truncationMethod: 'none',
      };
    }

    const keepStart = Math.floor(targetLines * 0.4);
    const keepEnd = Math.floor(targetLines * 0.4);
    
    const result = [
      ...lines.slice(0, keepStart),
      `\n// [TRUNCATED: ${lines.length - targetLines} lines omitted]\n`,
      ...lines.slice(-keepEnd),
    ].join('\n');

    return {
      content: result,
      truncated: true,
      originalSize: Buffer.byteLength(content, 'utf8'),
      finalSize: Buffer.byteLength(result, 'utf8'),
      syntaxValid: true,
      truncationMethod: 'generic-safe',
    };
  }

  /**
   * Truncación para markup (HTML/XML)
   */
  private truncateMarkup(content: string, maxSize: number): TruncationResult {
    // Implementación básica - se puede expandir
    return this.truncateGeneric(content, maxSize);
  }
}

// Factory function
export function createSyntaxAwareTruncator(config?: Partial<SyntaxConfig>): SyntaxAwareTruncator {
  return new SyntaxAwareTruncator(config);
}

// Global instance
const globalTruncator = createSyntaxAwareTruncator();

/**
 * Función de truncamiento inteligente para usar en reducers
 */
export function smartTruncate(content: string, maxSize: number, contentType?: string): string {
  const result = globalTruncator.truncate(content, maxSize, contentType);
  
  if (result.truncated) {
    logger.info("Content truncated with syntax preservation", {
      originalSize: result.originalSize,
      finalSize: result.finalSize,
      method: result.truncationMethod,
      syntaxValid: result.syntaxValid,
    });
  }
  
  return result.content;
}
