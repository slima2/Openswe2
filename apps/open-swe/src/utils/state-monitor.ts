import { createLogger, LogLevel } from "./logger.js";
import { createSmartSerializer, SerializationConfig } from "./smart-serializer.js";

const logger = createLogger(LogLevel.DEBUG, "StateMonitor");

export interface StateMetrics {
  sizeBytes: number;
  messageCount: number;
  toolOutputCount: number;
  historyLength: number;
  lastUpdated: Date;
  compressionRatio?: number;
  truncationCount: number;
}

export interface MonitoringConfig {
  maxSizeBytes: number;
  maxMessages: number;
  maxToolOutputs: number;
  maxHistoryLength: number;
  alertThreshold: number; // Porcentaje del límite para alertar
  autoCleanup: boolean;
}

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  maxSizeBytes: 100 * 1024 * 1024, // 100MB (aumentado de 50MB)
  maxMessages: 5000,               // 5000 mensajes (aumentado de 1000)
  maxToolOutputs: 2000,            // 2000 outputs (aumentado de 500)
  maxHistoryLength: 10000,         // 10000 elementos (aumentado de 2000)
  alertThreshold: 0.8, // 80% del límite
  autoCleanup: true,
};

export class StateMonitor {
  private config: MonitoringConfig;
  private serializer: ReturnType<typeof createSmartSerializer>;
  private metrics: StateMetrics;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.serializer = createSmartSerializer();
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): StateMetrics {
    return {
      sizeBytes: 0,
      messageCount: 0,
      toolOutputCount: 0,
      historyLength: 0,
      lastUpdated: new Date(),
      truncationCount: 0,
    };
  }

  analyzeState(state: any): StateMetrics {
    const sizeInfo = this.serializer.getSizeInfo(state);
    
    this.metrics = {
      sizeBytes: sizeInfo.sizeBytes,
      messageCount: this.countMessages(state),
      toolOutputCount: this.countToolOutputs(state),
      historyLength: this.getHistoryLength(state),
      lastUpdated: new Date(),
      compressionRatio: sizeInfo.shouldCompress ? 0.7 : undefined, // Estimación
      truncationCount: sizeInfo.shouldTruncate ? this.metrics.truncationCount + 1 : this.metrics.truncationCount,
    };

    this.logMetrics();
    this.checkAlerts();

    return this.metrics;
  }

  private countMessages(state: any): number {
    if (state.messages && Array.isArray(state.messages)) {
      return state.messages.length;
    }
    return 0;
  }

  private countToolOutputs(state: any): number {
    if (state.toolOutputs && Array.isArray(state.toolOutputs)) {
      return state.toolOutputs.length;
    }
    return 0;
  }

  private getHistoryLength(state: any): number {
    if (state.history && Array.isArray(state.history)) {
      return state.history.length;
    }
    return 0;
  }

  private logMetrics(): void {
    logger.debug("State metrics", {
      sizeMB: (this.metrics.sizeBytes / 1024 / 1024).toFixed(2),
      messageCount: this.metrics.messageCount,
      toolOutputCount: this.metrics.toolOutputCount,
      historyLength: this.metrics.historyLength,
      truncationCount: this.metrics.truncationCount,
    });
  }

  private checkAlerts(): void {
    const sizePercentage = this.metrics.sizeBytes / this.config.maxSizeBytes;
    const messagePercentage = this.metrics.messageCount / this.config.maxMessages;
    const toolOutputPercentage = this.metrics.toolOutputCount / this.config.maxToolOutputs;

    if (sizePercentage > this.config.alertThreshold) {
      logger.warn("State size approaching limit", {
        sizePercentage: (sizePercentage * 100).toFixed(1) + '%',
        sizeMB: (this.metrics.sizeBytes / 1024 / 1024).toFixed(2),
        maxSizeMB: (this.config.maxSizeBytes / 1024 / 1024).toFixed(2),
      });
    }

    if (messagePercentage > this.config.alertThreshold) {
      logger.warn("Message count approaching limit", {
        messagePercentage: (messagePercentage * 100).toFixed(1) + '%',
        messageCount: this.metrics.messageCount,
        maxMessages: this.config.maxMessages,
      });
    }

    if (toolOutputPercentage > this.config.alertThreshold) {
      logger.warn("Tool output count approaching limit", {
        toolOutputPercentage: (toolOutputPercentage * 100).toFixed(1) + '%',
        toolOutputCount: this.metrics.toolOutputCount,
        maxToolOutputs: this.config.maxToolOutputs,
      });
    }
  }

  shouldCleanup(): boolean {
    if (!this.config.autoCleanup) return false;

    const sizePercentage = this.metrics.sizeBytes / this.config.maxSizeBytes;
    const messagePercentage = this.metrics.messageCount / this.config.maxMessages;

    return sizePercentage > 0.9 || messagePercentage > 0.9;
  }

  getCleanupRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.messageCount > this.config.maxMessages * 0.8) {
      recommendations.push("Consider truncating message history");
    }

    if (this.metrics.toolOutputCount > this.config.maxToolOutputs * 0.8) {
      recommendations.push("Consider compressing tool outputs");
    }

    if (this.metrics.historyLength > this.config.maxHistoryLength * 0.8) {
      recommendations.push("Consider summarizing old history");
    }

    if (this.metrics.sizeBytes > this.config.maxSizeBytes * 0.8) {
      recommendations.push("Consider enabling compression or truncation");
    }

    return recommendations;
  }

  getMetrics(): StateMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }
}

export function createStateMonitor(config?: Partial<MonitoringConfig>): StateMonitor {
  return new StateMonitor(config);
}
