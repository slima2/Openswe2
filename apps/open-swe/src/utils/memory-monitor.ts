import { createLogger, LogLevel } from "./logger.js";

const logger = createLogger(LogLevel.INFO, "MemoryMonitor");

export interface MemoryStats {
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  timestamp: number;
}

export interface MemoryAlert {
  level: 'warning' | 'critical';
  metric: keyof MemoryStats;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: number;
}

export interface MemoryMonitorConfig {
  intervalMs: number;
  warningThresholds: {
    heapUsedMB: number;
    externalMB: number;
    arrayBuffersMB: number;
  };
  criticalThresholds: {
    heapUsedMB: number;
    externalMB: number;
    arrayBuffersMB: number;
  };
  enableGCTrigger: boolean;
  maxHistoryEntries: number;
}

// Dynamic configuration based on heap limit
function getHeapLimitMB(): number {
  const heapLimit = process.env.LG_MAX_HEAP_SIZE;
  if (heapLimit) {
    return parseInt(heapLimit, 10);
  }
  
  // Try to detect from NODE_OPTIONS
  const nodeOptions = process.env.NODE_OPTIONS || '';
  const match = nodeOptions.match(/--max-old-space-size=(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // Default conservative limit
  return 8192; // 8GB default
}

const HEAP_LIMIT_MB = getHeapLimitMB();

export const DEFAULT_MONITOR_CONFIG: MemoryMonitorConfig = {
  intervalMs: 5000, // Check every 5 seconds
  warningThresholds: {
    heapUsedMB: Math.floor(HEAP_LIMIT_MB * 0.7), // 70% of heap limit
    externalMB: Math.floor(HEAP_LIMIT_MB * 0.3),  // 30% of heap limit
    arrayBuffersMB: Math.floor(HEAP_LIMIT_MB * 0.2), // 20% of heap limit
  },
  criticalThresholds: {
    heapUsedMB: Math.floor(HEAP_LIMIT_MB * 0.85), // 85% of heap limit
    externalMB: Math.floor(HEAP_LIMIT_MB * 0.5),   // 50% of heap limit
    arrayBuffersMB: Math.floor(HEAP_LIMIT_MB * 0.3), // 30% of heap limit
  },
  enableGCTrigger: true,
  maxHistoryEntries: 100, // Keep last 100 measurements
};

export class MemoryMonitor {
  private config: MemoryMonitorConfig;
  private history: MemoryStats[] = [];
  private alerts: MemoryAlert[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: Partial<MemoryMonitorConfig> = {}) {
    this.config = { ...DEFAULT_MONITOR_CONFIG, ...config };
  }

  /**
   * Start monitoring memory usage
   */
  start(): void {
    if (this.isRunning) {
      logger.warn("Memory monitor is already running");
      return;
    }

    logger.info("Starting memory monitor", {
      intervalMs: this.config.intervalMs,
      warningThresholds: this.config.warningThresholds,
      criticalThresholds: this.config.criticalThresholds,
    });

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.checkMemory();
    }, this.config.intervalMs);

    // Initial check
    this.checkMemory();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info("Stopped memory monitor");
  }

  /**
   * Check current memory usage and trigger alerts if needed
   */
  private checkMemory(): void {
    const memUsage = process.memoryUsage();
    const stats: MemoryStats = {
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      timestamp: Date.now(),
    };

    // Add to history
    this.history.push(stats);
    if (this.history.length > this.config.maxHistoryEntries) {
      this.history.shift();
    }

    // Check thresholds and generate alerts
    this.checkThresholds(stats);

    // Log current status
    const memoryMB = {
      rss: Math.round(stats.rss / 1024 / 1024),
      heapUsed: Math.round(stats.heapUsed / 1024 / 1024),
      heapTotal: Math.round(stats.heapTotal / 1024 / 1024),
      external: Math.round(stats.external / 1024 / 1024),
      arrayBuffers: Math.round(stats.arrayBuffers / 1024 / 1024),
    };

    logger.debug("Memory usage", memoryMB);
  }

  /**
   * Check memory thresholds and generate alerts
   */
  private checkThresholds(stats: MemoryStats): void {
    const heapUsedMB = stats.heapUsed / 1024 / 1024;
    const externalMB = stats.external / 1024 / 1024;
    const arrayBuffersMB = stats.arrayBuffers / 1024 / 1024;

    // Check critical thresholds
    if (heapUsedMB > this.config.criticalThresholds.heapUsedMB) {
      this.generateAlert('critical', 'heapUsed', heapUsedMB, this.config.criticalThresholds.heapUsedMB, 
        `Heap usage is critically high: ${heapUsedMB.toFixed(0)}MB`);
    }

    if (externalMB > this.config.criticalThresholds.externalMB) {
      this.generateAlert('critical', 'external', externalMB, this.config.criticalThresholds.externalMB,
        `External memory usage is critically high: ${externalMB.toFixed(0)}MB (likely large Buffers/ArrayBuffers)`);
    }

    if (arrayBuffersMB > this.config.criticalThresholds.arrayBuffersMB) {
      this.generateAlert('critical', 'arrayBuffers', arrayBuffersMB, this.config.criticalThresholds.arrayBuffersMB,
        `ArrayBuffer usage is critically high: ${arrayBuffersMB.toFixed(0)}MB`);
    }

    // Check warning thresholds
    if (heapUsedMB > this.config.warningThresholds.heapUsedMB) {
      this.generateAlert('warning', 'heapUsed', heapUsedMB, this.config.warningThresholds.heapUsedMB,
        `Heap usage is high: ${heapUsedMB.toFixed(0)}MB`);
    }

    if (externalMB > this.config.warningThresholds.externalMB) {
      this.generateAlert('warning', 'external', externalMB, this.config.warningThresholds.externalMB,
        `External memory usage is high: ${externalMB.toFixed(0)}MB`);
    }

    if (arrayBuffersMB > this.config.warningThresholds.arrayBuffersMB) {
      this.generateAlert('warning', 'arrayBuffers', arrayBuffersMB, this.config.warningThresholds.arrayBuffersMB,
        `ArrayBuffer usage is high: ${arrayBuffersMB.toFixed(0)}MB`);
    }
  }

  /**
   * Generate a memory alert
   */
  private generateAlert(
    level: 'warning' | 'critical',
    metric: keyof MemoryStats,
    currentValue: number,
    threshold: number,
    message: string
  ): void {
    const alert: MemoryAlert = {
      level,
      metric,
      currentValue,
      threshold,
      message,
      timestamp: Date.now(),
    };

    this.alerts.push(alert);

    // Log the alert
    if (level === 'critical') {
      logger.error(message, { metric, currentValue, threshold });
      
      // Trigger GC if enabled
      if (this.config.enableGCTrigger && global.gc) {
        logger.info("Triggering garbage collection due to critical memory usage");
        global.gc();
      }
    } else {
      logger.warn(message, { metric, currentValue, threshold });
    }

    // Keep only recent alerts (last 50)
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
  }

  /**
   * Get current memory statistics
   */
  getCurrentStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      timestamp: Date.now(),
    };
  }

  /**
   * Get memory usage history
   */
  getHistory(): MemoryStats[] {
    return [...this.history];
  }

  /**
   * Get recent alerts
   */
  getAlerts(): MemoryAlert[] {
    return [...this.alerts];
  }

  /**
   * Get memory usage trend (positive = increasing, negative = decreasing)
   */
  getTrend(metric: keyof MemoryStats, windowSize: number = 10): number {
    if (this.history.length < windowSize) {
      return 0;
    }

    const recent = this.history.slice(-windowSize);
    const first = recent[0][metric];
    const last = recent[recent.length - 1][metric];

    return last - first;
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC(): boolean {
    if (global.gc) {
      logger.info("Forcing garbage collection");
      global.gc();
      return true;
    } else {
      logger.warn("Garbage collection not available (run with --expose-gc)");
      return false;
    }
  }

  /**
   * Get comprehensive memory report
   */
  getReport(): {
    current: MemoryStats;
    trends: Record<keyof MemoryStats, number>;
    recentAlerts: MemoryAlert[];
    recommendations: string[];
  } {
    const current = this.getCurrentStats();
    const trends = {
      rss: this.getTrend('rss'),
      heapUsed: this.getTrend('heapUsed'),
      heapTotal: this.getTrend('heapTotal'),
      external: this.getTrend('external'),
      arrayBuffers: this.getTrend('arrayBuffers'),
      timestamp: 0,
    };

    const recentAlerts = this.alerts.slice(-10);
    const recommendations: string[] = [];

    // Generate recommendations based on current state
    const heapUsedMB = current.heapUsed / 1024 / 1024;
    const externalMB = current.external / 1024 / 1024;
    const arrayBuffersMB = current.arrayBuffers / 1024 / 1024;

    if (heapUsedMB > this.config.warningThresholds.heapUsedMB) {
      recommendations.push("Consider implementing streaming for large data processing");
      recommendations.push("Review object retention and ensure proper cleanup");
    }

    if (externalMB > this.config.warningThresholds.externalMB) {
      recommendations.push("Large external memory usage detected - likely Buffers/ArrayBuffers are being retained");
      recommendations.push("Consider streaming file operations instead of loading entire files into memory");
    }

    if (trends.heapUsed > 10 * 1024 * 1024) { // Growing by more than 10MB
      recommendations.push("Heap usage is trending upward - possible memory leak");
    }

    return {
      current,
      trends,
      recentAlerts,
      recommendations,
    };
  }
}

// Global monitor instance
let globalMonitor: MemoryMonitor | null = null;

/**
 * Start global memory monitoring
 */
export function startMemoryMonitoring(config?: Partial<MemoryMonitorConfig>): MemoryMonitor {
  if (globalMonitor) {
    globalMonitor.stop();
  }

  globalMonitor = new MemoryMonitor(config);
  globalMonitor.start();
  return globalMonitor;
}

/**
 * Stop global memory monitoring
 */
export function stopMemoryMonitoring(): void {
  if (globalMonitor) {
    globalMonitor.stop();
    globalMonitor = null;
  }
}

/**
 * Get the global monitor instance
 */
export function getMemoryMonitor(): MemoryMonitor | null {
  return globalMonitor;
}

/**
 * Get quick memory status
 */
export function getMemoryStatus(): {
  rss: string;
  heapUsed: string;
  external: string;
  arrayBuffers: string;
} {
  const stats = process.memoryUsage();
  return {
    rss: `${Math.round(stats.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(stats.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(stats.external / 1024 / 1024)}MB`,
    arrayBuffers: `${Math.round(stats.arrayBuffers / 1024 / 1024)}MB`,
  };
}
