import { createLogger, LogLevel } from "./logger.js";
import * as zlib from 'zlib';
import { promisify } from 'util';

const logger = createLogger(LogLevel.DEBUG, "SmartSerializer");
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface SerializationConfig {
  maxSizeBytes: number;
  compressionThreshold: number;
  enableCompression: boolean;
  chunkSize: number;
}

export const DEFAULT_SERIALIZATION_CONFIG: SerializationConfig = {
  maxSizeBytes: 200 * 1024 * 1024, // 200MB (aumentado para manejar resúmenes inteligentes)
  compressionThreshold: 10 * 1024 * 1024, // 10MB (aumentado para trabajar mejor con contexto resumido)
  enableCompression: true,
  chunkSize: 5 * 1024 * 1024, // 5MB chunks (aumentado para mejor rendimiento)
};

export class SmartSerializer {
  private config: SerializationConfig;

  constructor(config: Partial<SerializationConfig> = {}) {
    this.config = { ...DEFAULT_SERIALIZATION_CONFIG, ...config };
  }

  async serialize(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const sizeBytes = Buffer.byteLength(jsonString, 'utf8');

      logger.debug("Serializing data", {
        sizeBytes,
        compressionThreshold: this.config.compressionThreshold,
        enableCompression: this.config.enableCompression,
      });

      // Si el tamaño excede el límite, truncar y comprimir
      if (sizeBytes > this.config.maxSizeBytes) {
        logger.warn("Data too large, truncating and compressing", {
          originalSize: sizeBytes,
          maxSize: this.config.maxSizeBytes,
        });
        
        const truncatedData = this.truncateData(data);
        const truncatedJson = JSON.stringify(truncatedData);
        
        if (this.config.enableCompression) {
          return await this.compress(truncatedJson);
        }
        
        return truncatedJson;
      }

      // Si es grande pero no excede el límite, comprimir
      if (sizeBytes > this.config.compressionThreshold && this.config.enableCompression) {
        logger.debug("Compressing large data", { sizeBytes });
        return await this.compress(jsonString);
      }

      // Para datos pequeños, no comprimir
      return jsonString;
    } catch (error) {
      logger.error("Serialization failed", { error });
      
      // Fallback: serializar solo datos críticos
      const criticalData = this.extractCriticalData(data);
      return JSON.stringify(criticalData);
    }
  }

  async deserialize(serializedData: string): Promise<any> {
    try {
      // Detectar si está comprimido
      if (this.isCompressed(serializedData)) {
        const decompressed = await this.decompress(serializedData);
        return JSON.parse(decompressed);
      }

      return JSON.parse(serializedData);
    } catch (error) {
      logger.error("Deserialization failed", { error });
      throw new Error(`Failed to deserialize data: ${error}`);
    }
  }

  private async compress(data: string): Promise<string> {
    const buffer = Buffer.from(data, 'utf8');
    const compressed = await gzip(buffer);
    return compressed.toString('base64');
  }

  private async decompress(compressedData: string): Promise<string> {
    const buffer = Buffer.from(compressedData, 'base64');
    const decompressed = await gunzip(buffer);
    return decompressed.toString('utf8');
  }

  private isCompressed(data: string): boolean {
    try {
      // Intentar decodificar como base64
      Buffer.from(data, 'base64');
      return true;
    } catch {
      return false;
    }
  }

  private truncateData(data: any): any {
    // Mantener solo datos críticos
    if (typeof data === 'object' && data !== null) {
      const truncated: any = {};
      
      // Mantener siempre estos campos críticos
      const criticalFields = ['currentTask', 'availableTools', 'systemPrompt', 'recentMessages'];
      
      for (const field of criticalFields) {
        if (data[field] !== undefined) {
          truncated[field] = data[field];
        }
      }

      // Truncar campos grandes con límites más generosos
      if (data.messages && Array.isArray(data.messages)) {
        // Mantener los últimos 50 mensajes (en lugar de 10)
        truncated.messages = data.messages.slice(-50);
      }

      if (data.toolOutputs && Array.isArray(data.toolOutputs)) {
        // Mantener los últimos 20 outputs (en lugar de 5)
        truncated.toolOutputs = data.toolOutputs.slice(-20);
      }

      if (data.history && Array.isArray(data.history)) {
        // Mantener los últimos 100 elementos (en lugar de 20)
        truncated.history = data.history.slice(-100);
      }

      // Agregar metadata de truncamiento
      truncated._truncated = true;
      truncated._originalSize = JSON.stringify(data).length;
      truncated._truncatedAt = new Date().toISOString();

      return truncated;
    }

    return data;
  }

  private extractCriticalData(data: any): any {
    // Extraer solo datos esenciales para el funcionamiento
    return {
      currentTask: data.currentTask || 'Unknown task',
      availableTools: data.availableTools || [],
      systemPrompt: data.systemPrompt || '',
      recentMessages: data.recentMessages || [],
      _fallback: true,
      _extractedAt: new Date().toISOString(),
      _system: 'GPTfy',
    };
  }

  getSizeInfo(data: any): { sizeBytes: number; shouldCompress: boolean; shouldTruncate: boolean } {
    const jsonString = JSON.stringify(data);
    const sizeBytes = Buffer.byteLength(jsonString, 'utf8');

    return {
      sizeBytes,
      shouldCompress: sizeBytes > this.config.compressionThreshold && this.config.enableCompression,
      shouldTruncate: sizeBytes > this.config.maxSizeBytes,
    };
  }
}

export function createSmartSerializer(config?: Partial<SerializationConfig>): SmartSerializer {
  return new SmartSerializer(config);
}
