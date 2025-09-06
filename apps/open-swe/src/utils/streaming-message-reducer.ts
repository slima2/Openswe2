import { BaseMessage, HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { Messages, messagesStateReducer } from "@langchain/langgraph";
import { createLogger, LogLevel } from "./logger.js";

const logger = createLogger(LogLevel.INFO, "StreamingMessageReducer");

export interface StreamingMessageConfig {
  maxMessages: number;
  maxTotalSizeBytes: number;
  preserveImportantMessages: boolean;
  compressionEnabled: boolean;
}

export const DEFAULT_STREAMING_CONFIG: StreamingMessageConfig = {
  maxMessages: 200, // Keep last 200 messages (optimized for large codebases)
  maxTotalSizeBytes: 50 * 1024 * 1024, // 50MB total message history
  preserveImportantMessages: true, // Keep human messages and important AI responses
  compressionEnabled: true,
};

interface MessageMetadata {
  sizeBytes: number;
  importance: number; // 0-10 scale
  timestamp: number;
}

export class StreamingMessageManager {
  private config: StreamingMessageConfig;
  private messageMetadata = new Map<string, MessageMetadata>();

  constructor(config: Partial<StreamingMessageConfig> = {}) {
    this.config = { ...DEFAULT_STREAMING_CONFIG, ...config };
  }

  /**
   * Streaming reducer that maintains bounded message history
   */
  reduceMessages(currentMessages: BaseMessage[], newMessages: BaseMessage[]): BaseMessage[] {
    // First, apply standard LangGraph message reduction
    const allMessages = messagesStateReducer(currentMessages, newMessages);
    
    // Then apply streaming bounds
    return this.applyStreamingBounds(allMessages);
  }

  /**
   * Apply streaming bounds to message list
   */
  private applyStreamingBounds(messages: BaseMessage[]): BaseMessage[] {
    if (messages.length <= this.config.maxMessages) {
      const totalSize = this.calculateTotalSize(messages);
      if (totalSize <= this.config.maxTotalSizeBytes) {
        return messages; // Within bounds, no reduction needed
      }
    }

    logger.info("Applying streaming message bounds", {
      currentCount: messages.length,
      maxMessages: this.config.maxMessages,
      currentSizeBytes: this.calculateTotalSize(messages),
      maxSizeBytes: this.config.maxTotalSizeBytes,
    });

    // Update metadata for all messages
    this.updateMessageMetadata(messages);

    // Create sliding window with importance-based retention
    return this.createSlidingWindow(messages);
  }

  /**
   * Create sliding window that preserves important messages
   */
  private createSlidingWindow(messages: BaseMessage[]): BaseMessage[] {
    if (!this.config.preserveImportantMessages) {
      // Simple sliding window - keep last N messages
      const result = messages.slice(-this.config.maxMessages);
      logger.info("Applied simple sliding window", {
        originalCount: messages.length,
        newCount: result.length,
      });
      return result;
    }

    // Smart sliding window - preserve important messages
    const important: BaseMessage[] = [];
    const regular: BaseMessage[] = [];

    for (const message of messages) {
      const importance = this.calculateMessageImportance(message);
      if (importance >= 7) { // High importance threshold
        important.push(message);
      } else {
        regular.push(message);
      }
    }

    // Always keep recent messages + important messages
    const recentCount = Math.floor(this.config.maxMessages * 0.7); // 70% for recent
    const importantCount = this.config.maxMessages - recentCount;

    const recentMessages = regular.slice(-recentCount);
    const importantMessages = important.slice(-importantCount);

    // Merge and sort by timestamp/order
    const result = [...importantMessages, ...recentMessages].sort((a, b) => {
      // Preserve original message order
      const aIndex = messages.indexOf(a);
      const bIndex = messages.indexOf(b);
      return aIndex - bIndex;
    });

    logger.info("Applied smart sliding window", {
      originalCount: messages.length,
      newCount: result.length,
      importantKept: importantMessages.length,
      recentKept: recentMessages.length,
    });

    return result;
  }

  /**
   * Calculate message importance (0-10 scale)
   */
  private calculateMessageImportance(message: BaseMessage): number {
    let importance = 5; // Base importance

    // Human messages are always important
    if (message instanceof HumanMessage) {
      importance = 9;
    }

    // Tool messages with errors are important
    if (message instanceof ToolMessage) {
      const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
      if (content.toLowerCase().includes('error') || content.toLowerCase().includes('failed')) {
        importance = 8;
      } else {
        importance = 6; // Tool results are moderately important
      }
    }

    // AI messages with tool calls are important
    if (message instanceof AIMessage && message.tool_calls && message.tool_calls.length > 0) {
      importance = 7;
    }

    // Check for specific important content patterns
    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    if (content.includes('task completed') || content.includes('plan:') || content.includes('summary:')) {
      importance = Math.min(importance + 2, 10);
    }

    return importance;
  }

  /**
   * Update metadata for messages
   */
  private updateMessageMetadata(messages: BaseMessage[]): void {
    for (const message of messages) {
      if (!message.id) continue;

      if (!this.messageMetadata.has(message.id)) {
        const sizeBytes = this.calculateMessageSize(message);
        const importance = this.calculateMessageImportance(message);
        
        this.messageMetadata.set(message.id, {
          sizeBytes,
          importance,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Calculate size of a single message
   */
  private calculateMessageSize(message: BaseMessage): number {
    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    let size = Buffer.byteLength(content, 'utf8');
    
    // Add size of additional kwargs
    if (message.additional_kwargs) {
      size += Buffer.byteLength(JSON.stringify(message.additional_kwargs), 'utf8');
    }
    
    // Add size of tool calls
    if ('tool_calls' in message && message.tool_calls) {
      size += Buffer.byteLength(JSON.stringify(message.tool_calls), 'utf8');
    }
    
    return size;
  }

  /**
   * Calculate total size of message array
   */
  private calculateTotalSize(messages: BaseMessage[]): number {
    return messages.reduce((total, message) => {
      return total + this.calculateMessageSize(message);
    }, 0);
  }

  /**
   * Get statistics about current message state
   */
  getStats(messages: BaseMessage[]) {
    const totalSize = this.calculateTotalSize(messages);
    const avgSize = messages.length > 0 ? totalSize / messages.length : 0;
    
    const typeCounts = messages.reduce((counts, message) => {
      const type = message.constructor.name;
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      totalMessages: messages.length,
      totalSizeBytes: totalSize,
      avgMessageSizeBytes: avgSize,
      utilizationPercent: (totalSize / this.config.maxTotalSizeBytes) * 100,
      messageTypeCounts: typeCounts,
      withinBounds: messages.length <= this.config.maxMessages && totalSize <= this.config.maxTotalSizeBytes,
    };
  }
}

// Factory function
export function createStreamingMessageManager(config?: Partial<StreamingMessageConfig>): StreamingMessageManager {
  return new StreamingMessageManager(config);
}

// Global instance for use in reducers
const globalStreamingManager = createStreamingMessageManager();

/**
 * Streaming message reducer for LangGraph state
 */
export function streamingMessageReducer(
  currentMessages: BaseMessage[] | undefined,
  newMessages: BaseMessage[]
): BaseMessage[] {
  const current = currentMessages || [];
  return globalStreamingManager.reduceMessages(current, newMessages);
}

/**
 * Configure global streaming manager
 */
export function configureStreamingMessages(config: Partial<StreamingMessageConfig>): void {
  Object.assign(globalStreamingManager['config'], config);
  logger.info("Updated streaming message configuration", config);
}
