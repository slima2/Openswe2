import { createLogger, LogLevel } from "./logger.js";

const logger = createLogger(LogLevel.INFO, "BoundedDocumentCache");

export interface BoundedCacheConfig {
  maxSizeBytes: number;
  maxEntries: number;
  compressionThreshold: number;
  enableCompression: boolean;
}

export const DEFAULT_CACHE_CONFIG: BoundedCacheConfig = {
  maxSizeBytes: 500 * 1024 * 1024, // 500MB total cache (optimized for large codebases)
  maxEntries: 1000, // Max 1000 documents
  compressionThreshold: 1 * 1024 * 1024, // Compress documents > 1MB
  enableCompression: true,
};

interface CacheEntry {
  content: string;
  compressed: boolean;
  sizeBytes: number;
  lastAccessed: number;
  accessCount: number;
}

export class BoundedDocumentCache {
  private cache = new Map<string, CacheEntry>();
  private currentSizeBytes = 0;
  private config: BoundedCacheConfig;

  constructor(config: Partial<BoundedCacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /**
   * Streaming get - returns content immediately if cached, 
   * otherwise returns null (caller should fetch and set)
   */
  get(url: string): string | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    // Update access stats for LRU
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    logger.debug("Cache hit", { 
      url, 
      sizeBytes: entry.sizeBytes,
      compressed: entry.compressed,
      accessCount: entry.accessCount 
    });

    return entry.compressed ? this.decompress(entry.content) : entry.content;
  }

  /**
   * Bounded set - automatically manages memory limits
   */
  set(url: string, content: string): void {
    const sizeBytes = Buffer.byteLength(content, 'utf8');
    
    // Skip if content is too large for the entire cache
    if (sizeBytes > this.config.maxSizeBytes * 0.8) {
      logger.warn("Content too large for cache, skipping", { 
        url, 
        sizeBytes, 
        maxSizeBytes: this.config.maxSizeBytes 
      });
      return;
    }

    // Compress large content
    let finalContent = content;
    let compressed = false;
    
    if (sizeBytes > this.config.compressionThreshold && this.config.enableCompression) {
      finalContent = this.compress(content);
      compressed = true;
      logger.debug("Compressed cache entry", { 
        url, 
        originalSize: sizeBytes, 
        compressedSize: Buffer.byteLength(finalContent, 'utf8') 
      });
    }

    const finalSize = Buffer.byteLength(finalContent, 'utf8');

    // Remove existing entry if updating
    if (this.cache.has(url)) {
      const existing = this.cache.get(url)!;
      this.currentSizeBytes -= existing.sizeBytes;
    }

    // Evict entries until we have space
    this.evictToMakeSpace(finalSize);

    // Add new entry
    const entry: CacheEntry = {
      content: finalContent,
      compressed,
      sizeBytes: finalSize,
      lastAccessed: Date.now(),
      accessCount: 1,
    };

    this.cache.set(url, entry);
    this.currentSizeBytes += finalSize;

    logger.info("Added to cache", { 
      url, 
      sizeBytes: finalSize, 
      compressed,
      totalSize: this.currentSizeBytes,
      totalEntries: this.cache.size 
    });
  }

  /**
   * Streaming-friendly eviction - removes LRU entries
   */
  private evictToMakeSpace(neededBytes: number): void {
    const targetSize = this.config.maxSizeBytes - neededBytes;
    
    if (this.currentSizeBytes <= targetSize && this.cache.size < this.config.maxEntries) {
      return; // No eviction needed
    }

    // Sort by LRU (least recently used first)
    const entries = Array.from(this.cache.entries()).sort((a, b) => {
      const [, entryA] = a;
      const [, entryB] = b;
      
      // Primary: last accessed time (older first)
      if (entryA.lastAccessed !== entryB.lastAccessed) {
        return entryA.lastAccessed - entryB.lastAccessed;
      }
      
      // Secondary: access count (less accessed first)
      return entryA.accessCount - entryB.accessCount;
    });

    let evictedCount = 0;
    let evictedBytes = 0;

    for (const [url, entry] of entries) {
      if (this.currentSizeBytes <= targetSize && this.cache.size < this.config.maxEntries) {
        break; // Evicted enough
      }

      this.cache.delete(url);
      this.currentSizeBytes -= entry.sizeBytes;
      evictedCount++;
      evictedBytes += entry.sizeBytes;
    }

    if (evictedCount > 0) {
      logger.info("Evicted cache entries", { 
        evictedCount, 
        evictedBytes,
        remainingSize: this.currentSizeBytes,
        remainingEntries: this.cache.size 
      });
    }
  }

  /**
   * Simple compression using base64 (real impl would use gzip)
   */
  private compress(content: string): string {
    // In production, use gzip compression
    // For now, just return as-is to avoid dependencies
    return content;
  }

  private decompress(content: string): string {
    // In production, use gzip decompression
    return content;
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats() {
    return {
      totalEntries: this.cache.size,
      totalSizeBytes: this.currentSizeBytes,
      maxSizeBytes: this.config.maxSizeBytes,
      utilizationPercent: (this.currentSizeBytes / this.config.maxSizeBytes) * 100,
      avgEntrySizeBytes: this.cache.size > 0 ? this.currentSizeBytes / this.cache.size : 0,
    };
  }

  /**
   * Clear all entries (for testing/cleanup)
   */
  clear(): void {
    this.cache.clear();
    this.currentSizeBytes = 0;
    logger.info("Cache cleared");
  }

  /**
   * Convert to plain object for state serialization
   */
  toPlainObject(): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [url, entry] of this.cache.entries()) {
      result[url] = entry.compressed ? this.decompress(entry.content) : entry.content;
    }
    
    return result;
  }

  /**
   * Restore from plain object (for state deserialization)
   */
  fromPlainObject(obj: Record<string, string>): void {
    this.clear();
    
    for (const [url, content] of Object.entries(obj)) {
      this.set(url, content);
    }
  }
}

// Factory function
export function createBoundedDocumentCache(config?: Partial<BoundedCacheConfig>): BoundedDocumentCache {
  return new BoundedDocumentCache(config);
}

// Reducer function for LangGraph state
export function boundedDocumentCacheReducer(
  state: BoundedDocumentCache | undefined,
  update: Record<string, string>
): BoundedDocumentCache {
  const cache = state || createBoundedDocumentCache();
  
  // Add all updates to cache (cache handles bounds internally)
  for (const [url, content] of Object.entries(update)) {
    cache.set(url, content);
  }
  
  return cache;
}
