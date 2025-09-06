import { createLogger, LogLevel } from "./logger.js";

const logger = createLogger(LogLevel.INFO, "BoundedStringManager");

export interface BoundedStringConfig {
  maxSizeBytes: number;
  compressionThreshold: number;
  enableCompression: boolean;
  enableSummarization: boolean;
  summarizationThreshold: number;
}

export const DEFAULT_BOUNDED_STRING_CONFIG: BoundedStringConfig = {
  maxSizeBytes: 50 * 1024 * 1024, // 50MB max per string (optimized for large codebases)
  compressionThreshold: 5 * 1024 * 1024, // Compress strings > 5MB
  enableCompression: true,
  enableSummarization: true,
  summarizationThreshold: 30 * 1024 * 1024, // Summarize strings > 30MB
};

export interface BoundedString {
  content: string;
  compressed: boolean;
  summarized: boolean;
  originalSizeBytes: number;
  currentSizeBytes: number;
  lastModified: number;
}

export class BoundedStringManager {
  private config: BoundedStringConfig;

  constructor(config: Partial<BoundedStringConfig> = {}) {
    this.config = { ...DEFAULT_BOUNDED_STRING_CONFIG, ...config };
  }

  /**
   * Process a string to ensure it stays within bounds
   */
  processString(content: string, fieldName: string = 'unknown'): BoundedString {
    const originalSize = Buffer.byteLength(content, 'utf8');

    logger.debug("Processing string", {
      fieldName,
      originalSize,
      maxSize: this.config.maxSizeBytes,
    });

    let processedContent = content;
    let compressed = false;
    let summarized = false;

    // Step 1: Summarize if too large
    if (originalSize > this.config.summarizationThreshold && this.config.enableSummarization) {
      processedContent = this.summarizeContent(content, fieldName);
      summarized = true;
      
      logger.info("Summarized large string", {
        fieldName,
        originalSize,
        summarizedSize: Buffer.byteLength(processedContent, 'utf8'),
      });
    }

    // Step 2: Compress if still large
    const currentSize = Buffer.byteLength(processedContent, 'utf8');
    if (currentSize > this.config.compressionThreshold && this.config.enableCompression) {
      processedContent = this.compressContent(processedContent);
      compressed = true;
      
      logger.debug("Compressed string", {
        fieldName,
        uncompressedSize: currentSize,
        compressedSize: Buffer.byteLength(processedContent, 'utf8'),
      });
    }

    // Step 3: Truncate if still too large
    const finalSize = Buffer.byteLength(processedContent, 'utf8');
    if (finalSize > this.config.maxSizeBytes) {
      const truncateLength = Math.floor(this.config.maxSizeBytes * 0.8); // Leave some buffer
      processedContent = this.truncateContent(processedContent, truncateLength, fieldName);
      
      logger.warn("Truncated string to fit bounds", {
        fieldName,
        originalSize: finalSize,
        truncatedSize: Buffer.byteLength(processedContent, 'utf8'),
      });
    }

    return {
      content: processedContent,
      compressed,
      summarized,
      originalSizeBytes: originalSize,
      currentSizeBytes: Buffer.byteLength(processedContent, 'utf8'),
      lastModified: Date.now(),
    };
  }

  /**
   * Extract content from bounded string (handles decompression)
   */
  extractContent(boundedString: BoundedString): string {
    let content = boundedString.content;

    if (boundedString.compressed) {
      content = this.decompressContent(content);
    }

    return content;
  }

  /**
   * Summarize content using simple heuristics
   * In production, this would use an LLM for intelligent summarization
   */
  private summarizeContent(content: string, fieldName: string): string {
    // Different summarization strategies based on content type
    if (fieldName === 'codebaseTree') {
      return this.summarizeCodebaseTree(content);
    }
    
    if (fieldName === 'contextGatheringNotes') {
      return this.summarizeNotes(content);
    }
    
    // Generic summarization
    return this.genericSummarize(content);
  }

  /**
   * Summarize codebase tree by keeping only important files/directories
   * Optimized for giant codebases (100GB+)
   */
  private summarizeCodebaseTree(tree: string): string {
    // Use specialized giant codebase strategy
    const { summarizeGiantCodebase, analyzeCodebaseSize } = require('./large-codebase-strategy.js');
    
    const stats = analyzeCodebaseSize(tree);
    const isGiantCodebase = stats.sizeBytes > 10 * 1024 * 1024; // >10MB tree = giant codebase
    
    if (isGiantCodebase) {
      logger.info("Using giant codebase summarization strategy", stats);
      return summarizeGiantCodebase(tree);
    }

    // Fallback to original strategy for smaller codebases
    const lines = tree.split('\n');
    const importantPatterns = [
      /\.(ts|tsx|js|jsx|py|java|cpp|c|h|cs|go|rs)$/i, // Source files
      /package\.json$/i,
      /README/i,
      /dockerfile/i,
      /\.env/i,
      /config/i,
    ];

    const importantLines = lines.filter(line => {
      return importantPatterns.some(pattern => pattern.test(line));
    });

    // Keep first 2000 important lines for large codebases
    const maxLines = Math.min(importantLines.length, 2000);
    const summary = `[SUMMARIZED CODEBASE TREE - Original: ${lines.length} lines, Kept: ${maxLines} important files]\n`;
    return summary + importantLines.slice(0, maxLines).join('\n');
  }

  /**
   * Summarize context gathering notes by keeping key points
   */
  private summarizeNotes(notes: string): string {
    const sections = notes.split('\n\n');
    
    // Keep sections that contain important keywords
    const importantKeywords = ['task:', 'plan:', 'error:', 'completed:', 'todo:', 'issue:', 'fix:'];
    const importantSections = sections.filter(section => {
      return importantKeywords.some(keyword => 
        section.toLowerCase().includes(keyword)
      );
    });

    // Keep last 20 important sections
    const summary = `[SUMMARIZED NOTES - Original: ${sections.length} sections, Kept: ${Math.min(importantSections.length, 20)} key sections]\n\n`;
    return summary + importantSections.slice(-20).join('\n\n');
  }

  /**
   * Generic content summarization
   */
  private genericSummarize(content: string): string {
    const lines = content.split('\n');
    
    // Keep first 50 lines, last 50 lines, and lines with important keywords
    const importantKeywords = ['error', 'warning', 'todo', 'fixme', 'important', 'critical'];
    const importantLines = lines.filter(line => 
      importantKeywords.some(keyword => 
        line.toLowerCase().includes(keyword)
      )
    );

    const firstLines = lines.slice(0, 50);
    const lastLines = lines.slice(-50);
    const keyLines = importantLines.slice(0, 100);

    const summary = `[SUMMARIZED CONTENT - Original: ${lines.length} lines]\n\n`;
    const summarizedContent = [
      '--- BEGINNING ---',
      ...firstLines,
      '--- IMPORTANT EXCERPTS ---',
      ...keyLines,
      '--- END ---',
      ...lastLines,
    ].join('\n');

    return summary + summarizedContent;
  }

  /**
   * Simple compression (in production, use gzip)
   */
  private compressContent(content: string): string {
    // For now, return as-is to avoid dependencies
    // In production, implement gzip compression
    return content;
  }

  /**
   * Simple decompression (in production, use gunzip)
   */
  private decompressContent(content: string): string {
    // For now, return as-is
    // In production, implement gzip decompression
    return content;
  }

  /**
   * Truncate content intelligently preserving syntax
   */
  private truncateContent(content: string, maxBytes: number, fieldName?: string): string {
    if (Buffer.byteLength(content, 'utf8') <= maxBytes) {
      return content;
    }

    // Use syntax-aware truncation
    const { smartTruncate } = require('./syntax-aware-truncator.js');
    
    // Detect content type based on field name and content
    let contentType: string | undefined;
    if (fieldName === 'codebaseTree') {
      contentType = 'codebase-tree';
    } else if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      contentType = 'json';
    } else if (this.hasCodePatterns(content)) {
      contentType = 'javascript';
    }
    
    return smartTruncate(content, maxBytes, contentType);
  }

  /**
   * Detect if content contains code patterns
   */
  private hasCodePatterns(content: string): boolean {
    const codePatterns = [
      /function\s+\w+/,
      /class\s+\w+/,
      /interface\s+\w+/,
      /export\s+(default\s+)?/,
      /import\s+.+from/,
      /const\s+\w+\s*=/,
      /=>\s*{/,
    ];

    return codePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Get statistics about a bounded string
   */
  getStats(boundedString: BoundedString) {
    return {
      originalSizeBytes: boundedString.originalSizeBytes,
      currentSizeBytes: boundedString.currentSizeBytes,
      compressionRatio: boundedString.originalSizeBytes > 0 
        ? boundedString.currentSizeBytes / boundedString.originalSizeBytes 
        : 1,
      compressed: boundedString.compressed,
      summarized: boundedString.summarized,
      withinBounds: boundedString.currentSizeBytes <= this.config.maxSizeBytes,
      lastModified: boundedString.lastModified,
    };
  }
}

// Factory function
export function createBoundedStringManager(config?: Partial<BoundedStringConfig>): BoundedStringManager {
  return new BoundedStringManager(config);
}

// Global instance
const globalBoundedStringManager = createBoundedStringManager();

/**
 * Process a string to ensure it stays bounded
 */
export function boundString(content: string, fieldName?: string): string {
  const bounded = globalBoundedStringManager.processString(content, fieldName);
  return globalBoundedStringManager.extractContent(bounded);
}

/**
 * Reducer for bounded strings in LangGraph state
 */
export function boundedStringReducer(fieldName: string) {
  return (_state: string | undefined, update: string): string => {
    return boundString(update, fieldName);
  };
}
