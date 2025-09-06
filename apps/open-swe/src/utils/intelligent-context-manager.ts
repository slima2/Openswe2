import { BaseMessage, BaseMessageLike } from '@langchain/core/messages';
import { createLogger, LogLevel } from './logger.js';
import { 
  AdvancedToolAnalyzer, 
  ToolAnalysisResult, 
  AnalyzedTool, 
  ToolCriticalityLevel 
} from './advanced-tool-analyzer.js';
import { Provider } from './llms/model-manager.js';

const logger = createLogger(LogLevel.DEBUG, 'IntelligentContextManager');

// Types
export type MessagePriority = 'CRITICAL' | 'IMPORTANT' | 'SUMMARIZABLE';

// Provider-specific message formatting
interface ProviderMessageFormat {
  systemMessagePosition: 'first' | 'anywhere';
  supportsMultipleSystem: boolean;
  summaryMessageType: 'system' | 'user' | 'assistant';
  maxContextLength: number;
  requiresSystemFirst: boolean;
}

const PROVIDER_MESSAGE_FORMATS: Record<Provider, ProviderMessageFormat> = {
  'anthropic': {
    systemMessagePosition: 'first',
    supportsMultipleSystem: false,
    summaryMessageType: 'user',
    maxContextLength: 200000,
    requiresSystemFirst: true
  },
  'google-genai': {
    systemMessagePosition: 'first', 
    supportsMultipleSystem: false,
    summaryMessageType: 'user',
    maxContextLength: 2000000,
    requiresSystemFirst: true
  },
  'openai': {
    systemMessagePosition: 'first',
    supportsMultipleSystem: true, // OpenAI permite múltiples system messages
    summaryMessageType: 'system',
    maxContextLength: 400000,
    requiresSystemFirst: true
  }
};

export interface CodeGeneration {
  messageIndex: number;
  message: BaseMessageLike;
  toolCalls?: any[];
  codeContent: string;
  timestamp: string;
}

export interface ContextSummary {
  role: 'system';
  content: string;
  metadata: {
    originalMessageCount: number;
    timeRange: string;
    keyDecisions: string[];
    errorsResolved: string[];
    progressMade: string[];
    toolAnalysis?: {
      essentialPreserved: number;
      importantSummarized: number;
      routineCompressed: number;
      totalAnalyzed: number;
    };
  };
}

export interface SummarizeOptions {
  keepLastCodeGenerations: number;
  summarizeOlderThan: number;
  heapUsage: number;
}

/**
 * Analyzes message content to determine its importance for context preservation
 */
export class ContentAnalyzer {
  /**
   * Classify message based on content importance
   */
  classifyMessage(message: BaseMessageLike): MessagePriority {
    if (this.isCodeGeneration(message)) {
      return 'CRITICAL';
    }
    
    if (this.isErrorResolution(message) || this.isSystemPrompt(message)) {
      return 'IMPORTANT';
    }
    
    if (this.isOldConversation(message)) {
      return 'SUMMARIZABLE';
    }
    
    return 'IMPORTANT'; // Default to important if unsure
  }

  /**
   * Check if message contains code generation
   */
  isCodeGeneration(message: BaseMessageLike): boolean {
    const content = this.getMessageContent(message);
    
    // Check for code blocks
    if (content.includes('```')) {
      return true;
    }
    
    // Check for tool calls that modify code
    if (typeof message === 'object' && 'tool_calls' in message && message.tool_calls) {
      return message.tool_calls.some((call: any) => 
        call.function?.name?.includes('edit') ||
        call.function?.name?.includes('create') ||
        call.function?.name?.includes('str_replace')
      );
    }
    
    // Check for file paths and code-related content
    const codeIndicators = [
      '.tsx', '.ts', '.js', '.jsx', '.py', '.java', '.cpp',
      'function ', 'class ', 'const ', 'let ', 'var ',
      'import ', 'export ', 'interface ', 'type '
    ];
    
    return codeIndicators.some(indicator => content.includes(indicator));
  }

  /**
   * Check if message is about error resolution
   */
  isErrorResolution(message: BaseMessageLike): boolean {
    const content = this.getMessageContent(message).toLowerCase();
    
    const errorIndicators = [
      'error', 'exception', 'failed', 'fix', 'bug', 'issue',
      'problem', 'solution', 'resolve', 'debug', 'crash'
    ];
    
    return errorIndicators.some(indicator => content.includes(indicator));
  }

  /**
   * Check if message is a system prompt
   */
  isSystemPrompt(message: BaseMessageLike): boolean {
    if (typeof message === 'object' && 'role' in message) {
      if (message.role === 'system') {
        return true;
      }
      
      // Also check for system-like messages that might be incorrectly labeled
      if (message.role === 'user' || message.role === 'assistant') {
        const content = this.getMessageContent(message).toLowerCase();
        
        // Check for system prompt patterns
        const systemPatterns = [
          'you are a',
          'act as',
          'your role is',
          'system:',
          'instructions:',
          'you must',
          'always respond',
          'never do',
          'follow these rules'
        ];
        
        return systemPatterns.some(pattern => content.includes(pattern));
      }
    }
    
    const content = this.getMessageContent(message);
    return content.startsWith('You are') || content.includes('system:');
  }

  /**
   * Detect message type more accurately - NEW METHOD
   */
  getMessageType(message: BaseMessageLike): 'system' | 'human' | 'ai' | 'tool' | 'function' {
    // Direct role mapping
    if (typeof message === 'object' && 'role' in message) {
      if (message.role === 'system') return 'system';
      if (message.role === 'user' || message.role === 'human') return 'human';
      if (message.role === 'assistant' || message.role === 'ai') return 'ai';
      if (message.role === 'tool') return 'tool';
      if (message.role === 'function') return 'function';
    }
    
    // Content-based detection for ambiguous cases
    const content = this.getMessageContent(message);
    
    if (this.isSystemPrompt(message)) return 'system';
    if (this.isToolCall(message) || this.isToolResponse(message)) return 'tool';
    
    // Default fallback based on content patterns
    if (content.includes('```') || content.includes('Error:') || content.includes('Result:')) {
      return 'tool';
    }
    
    return 'human'; // Default fallback
  }

  /**
   * Check if message is a tool call - NEW METHOD
   */
  isToolCall(message: BaseMessageLike): boolean {
    if (typeof message === 'object' && 'tool_calls' in message && message.tool_calls) {
      return Array.isArray(message.tool_calls) && message.tool_calls.length > 0;
    }
    
    // Check content patterns for tool calls
    const content = this.getMessageContent(message);
    return content.includes('tool_call:') || content.includes('function_call:');
  }

  /**
   * Check if message is a tool response - NEW METHOD
   */
  isToolResponse(message: BaseMessageLike): boolean {
    if (typeof message === 'object' && 'role' in message) {
      if (message.role === 'tool' || message.role === 'function') {
        return true;
      }
    }
    
    // Check content patterns for tool responses
    const content = this.getMessageContent(message);
    const responsePatterns = [
      'command executed',
      'file created',
      'file updated',
      'error occurred',
      'result:',
      'output:',
      'stdout:',
      'stderr:'
    ];
    
    return responsePatterns.some(pattern => content.toLowerCase().includes(pattern));
  }

  /**
   * Check if message is from old conversation (placeholder for now)
   */
  isOldConversation(message: BaseMessageLike): boolean {
    // This would need timestamp logic in real implementation
    // For now, we'll use heuristics
    return false; // Will be determined by position in array
  }

  /**
   * Extract code generations from messages
   */
  extractCodeGenerations(messages: BaseMessageLike[]): CodeGeneration[] {
    const codeGenerations: CodeGeneration[] = [];
    
    messages.forEach((message, index) => {
      if (this.isCodeGeneration(message)) {
        const content = this.getMessageContent(message);
        
        codeGenerations.push({
          messageIndex: index,
          message,
          toolCalls: typeof message === 'object' && 'tool_calls' in message ? message.tool_calls : undefined,
          codeContent: content,
          timestamp: new Date().toISOString(), // Placeholder
        });
      }
    });
    
    return codeGenerations;
  }

  /**
   * Get content from message regardless of format
   */
  private getMessageContent(message: BaseMessageLike): string {
    if (typeof message === 'string') {
      return message;
    }
    
    if (typeof message === 'object' && 'content' in message) {
      if (typeof message.content === 'string') {
        return message.content;
      }
      if (Array.isArray(message.content)) {
        return message.content
          .map(item => typeof item === 'string' ? item : JSON.stringify(item))
          .join(' ');
      }
    }
    
    return JSON.stringify(message);
  }
}

/**
 * Creates intelligent summaries of conversation context with granular tool analysis
 */
export class IntelligentSummarizer {
  private advancedAnalyzer: AdvancedToolAnalyzer;

  constructor() {
    this.advancedAnalyzer = new AdvancedToolAnalyzer();
  }

  /**
   * Create a comprehensive summary of old context with granular tool preservation
   */
  async createContextSummary(oldMessages: BaseMessageLike[]): Promise<ContextSummary> {
    const analyzer = new ContentAnalyzer();
    
    // Extract key information
    const decisions = this.extractDecisions(oldMessages);
    const errors = this.extractErrorResolutions(oldMessages);
    const progress = this.extractProgress(oldMessages);
    
    // Advanced tool analysis
    const toolAnalysis = this.advancedAnalyzer.analyzeAllTools(oldMessages);
    
    // Create time range
    const timeRange = this.getTimeRange(oldMessages);
    
    const summary: ContextSummary = {
      role: 'system',
      content: this.createEnhancedSummaryContent(
        oldMessages.length, 
        timeRange, 
        decisions, 
        errors, 
        progress, 
        toolAnalysis
      ),
      metadata: {
        originalMessageCount: oldMessages.length,
        timeRange,
        keyDecisions: decisions,
        errorsResolved: errors,
        progressMade: progress,
        toolAnalysis: {
          essentialPreserved: toolAnalysis.essential.length,
          importantSummarized: toolAnalysis.important.length,
          routineCompressed: toolAnalysis.routine.length,
          totalAnalyzed: toolAnalysis.totalAnalyzed,
        }
      }
    };
    
    logger.info('Enhanced context summary created', {
      originalMessages: oldMessages.length,
      decisions: decisions.length,
      errors: errors.length,
      progress: progress.length,
      toolAnalysis: summary.metadata.toolAnalysis,
    });
    
    return summary;
  }

  /**
   * Create enhanced summary content with granular tool information
   */
  private createEnhancedSummaryContent(
    messageCount: number,
    timeRange: string,
    decisions: string[],
    errors: string[],
    progress: string[],
    toolAnalysis: ToolAnalysisResult
  ): string {
    return `
=== RESUMEN INTELIGENTE DE CONTEXTO ===

PERÍODO: ${timeRange}
MENSAJES RESUMIDOS: ${messageCount}
HERRAMIENTAS ANALIZADAS: ${toolAnalysis.totalAnalyzed}

🔴 HERRAMIENTAS ESENCIALES (PRESERVADAS COMPLETAS - ${toolAnalysis.essential.length}):
${toolAnalysis.essential.map(tool => `
- Mensaje ${tool.messageIndex}: ${tool.originalTool.function?.name || 'unknown'}
  📁 Archivo: ${tool.originalTool.function?.arguments?.path || 'N/A'}
  🔒 Razón crítica: ${tool.criticality.reason}
  📝 Contenido completo: ${this.truncateForDisplay(tool.originalTool.function?.arguments?.file_text || tool.originalTool.function?.arguments?.new_string || 'N/A')}
`).join('\n')}

🟡 HERRAMIENTAS IMPORTANTES (RESUMEN ESTRUCTURADO - ${toolAnalysis.important.length}):
${toolAnalysis.important.map(tool => `
- Mensaje ${tool.messageIndex}: ${tool.originalTool.function?.name || 'unknown'}
  📁 Archivo: ${tool.originalTool.function?.arguments?.path || 'N/A'}
  📋 Resumen: ${tool.summary || 'N/A'}
  🔧 Funciones: [${tool.keyElements?.functions.join(', ') || 'none'}]
  📤 Exports: [${tool.keyElements?.exports.join(', ') || 'none'}]
  🏷️  Types: [${tool.keyElements?.types.join(', ') || 'none'}]
`).join('\n')}

🟢 HERRAMIENTAS RUTINARIAS (RESUMEN BREVE - ${toolAnalysis.routine.length}):
${toolAnalysis.routine.map(tool => `
- Mensaje ${tool.messageIndex}: ${tool.summary || `${tool.originalTool.function?.name} → ${tool.originalTool.function?.arguments?.path}`}
`).join('\n')}

📋 DECISIONES CLAVE TOMADAS:
${decisions.map(d => `- ${d}`).join('\n')}

🐛 ERRORES RESUELTOS:
${errors.map(e => `- ${e}`).join('\n')}

✅ PROGRESO COMPLETADO:
${progress.map(p => `- ${p}`).join('\n')}

💡 NOTA IMPORTANTE: 
- Las herramientas ESENCIALES se preservan con contenido completo para evitar pérdida de configuraciones críticas
- Las herramientas IMPORTANTES mantienen estructura detallada para debugging
- Las herramientas RUTINARIAS se resumen brevemente para eficiencia
- Las últimas ${10} generaciones de código se mantienen completas además de este resumen

=== FIN DEL RESUMEN INTELIGENTE ===
    `;
  }

  /**
   * Truncate content for display in summary (avoid extremely long summaries)
   */
  private truncateForDisplay(content: string, maxLength: number = 500): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength) + '\n... [contenido truncado para visualización, pero preservado completo en contexto] ...';
  }

  /**
   * Extract key decisions from messages
   */
  private extractDecisions(messages: BaseMessageLike[]): string[] {
    const analyzer = new ContentAnalyzer();
    const decisions: string[] = [];
    
    messages.forEach(message => {
      const content = analyzer['getMessageContent'](message).toLowerCase();
      
      // Look for decision patterns
      if (content.includes('decided to') || 
          content.includes('will use') ||
          content.includes('approach:') ||
          content.includes('strategy:')) {
        
        // Extract the decision (simplified)
        const lines = content.split('\n');
        const decisionLine = lines.find(line => 
          line.includes('decided') || 
          line.includes('will use') ||
          line.includes('approach') ||
          line.includes('strategy')
        );
        
        if (decisionLine && decisions.length < 10) { // Limit decisions
          decisions.push(decisionLine.trim().substring(0, 100));
        }
      }
    });
    
    return decisions;
  }

  /**
   * Extract error resolutions from messages
   */
  private extractErrorResolutions(messages: BaseMessageLike[]): string[] {
    const analyzer = new ContentAnalyzer();
    const errors: string[] = [];
    
    messages.forEach(message => {
      if (analyzer.isErrorResolution(message)) {
        const content = analyzer['getMessageContent'](message);
        
        // Extract error description (simplified)
        const errorMatch = content.match(/(error|exception|failed|bug):\s*([^\n]{1,100})/i);
        if (errorMatch && errors.length < 10) { // Limit errors
          errors.push(errorMatch[2].trim());
        }
      }
    });
    
    return errors;
  }

  /**
   * Extract progress indicators from messages
   */
  private extractProgress(messages: BaseMessageLike[]): string[] {
    const analyzer = new ContentAnalyzer();
    const progress: string[] = [];
    
    messages.forEach(message => {
      const content = analyzer['getMessageContent'](message).toLowerCase();
      
      // Look for progress patterns
      if (content.includes('completed') || 
          content.includes('finished') ||
          content.includes('implemented') ||
          content.includes('created') ||
          content.includes('✅')) {
        
        // Extract progress item (simplified)
        const lines = content.split('\n');
        const progressLine = lines.find(line => 
          line.includes('completed') || 
          line.includes('finished') ||
          line.includes('implemented') ||
          line.includes('created') ||
          line.includes('✅')
        );
        
        if (progressLine && progress.length < 10) { // Limit progress items
          progress.push(progressLine.trim().substring(0, 100));
        }
      }
    });
    
    return progress;
  }

  /**
   * Get time range for messages (placeholder)
   */
  private getTimeRange(messages: BaseMessageLike[]): string {
    // In real implementation, would extract timestamps
    return `${messages.length} mensajes de conversación anterior`;
  }
}

/**
 * Main class for intelligent context management with gradual memory optimization
 */
export class IntelligentContextManager {
  private analyzer: ContentAnalyzer;
  private summarizer: IntelligentSummarizer;

  constructor() {
    this.analyzer = new ContentAnalyzer();
    this.summarizer = new IntelligentSummarizer();
  }

  /**
   * Main method: Adapt prompt based on memory usage with intelligent summarization
   */
  async adaptPrompt(messages: BaseMessageLike[], provider: Provider = 'anthropic'): Promise<BaseMessageLike[]> {
    const heapUsage = this.getHeapUsagePercentage();
    const providerFormat = PROVIDER_MESSAGE_FORMATS[provider];
    
    logger.info('Analyzing context for intelligent adaptation', {
      totalMessages: messages.length,
      heapUsage: `${(heapUsage * 100).toFixed(1)}%`,
      provider,
      maxContextLength: providerFormat.maxContextLength,
    });

    // No adaptation needed - memory is fine
    if (heapUsage < 0.60) {
      logger.debug('Memory usage normal, applying only provider formatting');
      return this.formatForProvider(messages, provider);
    }

    // Apply gradual intelligent summarization
    const adaptedMessages = await this.intelligentSummarize(messages, {
      keepLastCodeGenerations: 10,
      summarizeOlderThan: this.getSummarizationThreshold(heapUsage, messages.length),
      heapUsage,
    });

    // Apply provider-specific formatting
    return this.formatForProvider(adaptedMessages, provider);
  }

  /**
   * Format messages according to provider requirements
   */
  private formatForProvider(messages: BaseMessageLike[], provider: Provider): BaseMessageLike[] {
    const format = PROVIDER_MESSAGE_FORMATS[provider];
    
    if (!format.requiresSystemFirst) {
      return messages; // No special formatting needed
    }

    // Ensure system message is first (already handled in intelligentSummarize)
    // But validate and log for debugging
    const firstMessage = messages[0];
    const isSystemFirst = firstMessage && this.analyzer.isSystemPrompt(firstMessage);
    
    if (!isSystemFirst && messages.some(m => this.analyzer.isSystemPrompt(m))) {
      logger.warn(`Provider ${provider} requires system message first, but it's not positioned correctly`, {
        firstMessageRole: firstMessage?.role || 'none',
        totalMessages: messages.length
      });
    }

    logger.debug(`Messages formatted for provider: ${provider}`, {
      totalMessages: messages.length,
      systemFirst: isSystemFirst,
      summaryType: format.summaryMessageType
    });

    return messages;
  }

  /**
   * Intelligent summarization with granular tool preservation
   */
  private async intelligentSummarize(
    messages: BaseMessageLike[], 
    options: SummarizeOptions
  ): Promise<BaseMessageLike[]> {
    
    logger.info('Applying granular intelligent summarization', {
      originalLength: messages.length,
      heapUsage: `${(options.heapUsage * 100).toFixed(1)}%`,
      summarizeOlderThan: options.summarizeOlderThan,
      keepLastCodeGenerations: options.keepLastCodeGenerations,
    });

    const result: BaseMessageLike[] = [];
    
    // 1. PRESERVE ONLY THE FIRST/ORIGINAL SYSTEM PROMPT (CRITICAL FIX)
    const originalSystemPrompt = messages.find(m => this.analyzer.isSystemPrompt(m));
    if (originalSystemPrompt) {
      result.push(originalSystemPrompt);
      logger.debug('Preserved original system prompt as first message');
    }
    
    // 2. Determine what to summarize vs keep
    const recentMessages = messages.slice(-options.summarizeOlderThan);
    const oldMessages = messages.slice(0, -options.summarizeOlderThan);
    
    // 3. ADVANCED TOOL ANALYSIS for old messages
    if (oldMessages.length > 0) {
      const toolAnalysis = this.summarizer.advancedAnalyzer.analyzeAllTools(oldMessages);
      
      // 3a. ESSENTIAL tools: Preserve complete messages (NEVER summarize)
      const essentialMessageIndices = new Set(
        toolAnalysis.essential.map(tool => tool.messageIndex)
      );
      
      const essentialMessages = oldMessages.filter((_, index) => 
        essentialMessageIndices.has(index)
      );
      result.push(...essentialMessages);
      
      // 3b. Create enhanced summary for non-essential content
      const nonEssentialMessages = oldMessages.filter((_, index) => 
        !essentialMessageIndices.has(index)
      );
      
      if (nonEssentialMessages.length > 0) {
        const contextSummary = await this.summarizer.createContextSummary(oldMessages);
        
        // CRITICAL FIX: Convert summary to USER message (not system)
        const summaryAsUser: BaseMessageLike = {
          role: 'user',
          content: `[CONTEXTO RESUMIDO INTELIGENTEMENTE]\n\n${contextSummary.content}`,
          // Preserve any additional properties
          ...(contextSummary.additional_kwargs && { additional_kwargs: contextSummary.additional_kwargs })
        };
        
        result.push(summaryAsUser);
        logger.debug('Added context summary as user message (not system)');
      }
      
      logger.info('Granular tool analysis completed', {
        totalOldMessages: oldMessages.length,
        essentialPreserved: essentialMessages.length,
        nonEssentialSummarized: nonEssentialMessages.length,
        toolAnalysis: {
          essential: toolAnalysis.essential.length,
          important: toolAnalysis.important.length,
          routine: toolAnalysis.routine.length,
        }
      });
    }
    
    // 4. BACKUP: Preserve last N code generations (for recent messages too)
    const allCodeGenerations = this.analyzer.extractCodeGenerations(messages);
    const lastCodeGens = allCodeGenerations.slice(-options.keepLastCodeGenerations);
    
    // Only add code generations that aren't already in recent messages or essential messages
    const recentStartIndex = messages.length - options.summarizeOlderThan;
    const additionalCodeGenMessages = lastCodeGens
      .filter(cg => cg.messageIndex < recentStartIndex) // Not in recent
      .filter(cg => {
        // Not already added as essential
        const messageAlreadyAdded = result.some(msg => 
          msg === messages[cg.messageIndex]
        );
        return !messageAlreadyAdded;
      })
      .map(cg => cg.message);
    
    result.push(...additionalCodeGenMessages);
    
    // 5. Add recent conversation (excluding system prompts to avoid duplication)
    const recentNonSystemMessages = recentMessages.filter(m => !this.analyzer.isSystemPrompt(m));
    result.push(...recentNonSystemMessages);
    
    // VALIDATION: Ensure we actually reduced the context size
    const reductionRatio = (messages.length - result.length) / messages.length;
    const actualReductionPercentage = reductionRatio * 100;
    
    if (result.length >= messages.length) {
      logger.warn('Summarization failed to reduce context size - applying emergency reduction', {
        originalLength: messages.length,
        resultLength: result.length,
        expansion: result.length - messages.length
      });
      
      // Emergency: Keep only system + summary + last few messages
      const emergencyResult: BaseMessageLike[] = [];
      if (originalSystemPrompt) emergencyResult.push(originalSystemPrompt);
      
      // Add summary if we created one
      const summaryMessage = result.find(m => m.role === 'user' && m.content?.includes('[CONTEXTO RESUMIDO'));
      if (summaryMessage) emergencyResult.push(summaryMessage);
      
      // Add only the last 3 recent messages
      const lastFewMessages = recentNonSystemMessages.slice(-3);
      emergencyResult.push(...lastFewMessages);
      
      logger.info('Emergency context reduction applied', {
        originalLength: messages.length,
        emergencyLength: emergencyResult.length,
        finalReduction: `${(((messages.length - emergencyResult.length) / messages.length) * 100).toFixed(1)}%`
      });
      
      return emergencyResult;
    }

    logger.info('Granular intelligent summarization completed', {
      originalLength: messages.length,
      summarizedLength: result.length,
      systemPrompts: originalSystemPrompt ? 1 : 0,
      essentialToolsPreserved: result.filter(m => oldMessages.includes(m)).length,
      additionalCodeGens: additionalCodeGenMessages.length,
      recentMessagesKept: recentNonSystemMessages.length,
      reductionPercentage: `${actualReductionPercentage.toFixed(1)}%`,
      reductionSuccess: actualReductionPercentage > 0
    });
    
    return result;
  }

  /**
   * Determine summarization threshold based on memory pressure - IMPROVED LOGIC
   */
  private getSummarizationThreshold(heapUsage: number, totalMessages: number): number {
    // Calculate target reduction based on memory pressure
    let targetReductionRatio: number;
    
    if (heapUsage < 0.70) {
      targetReductionRatio = 0.7; // Keep 70% of messages
    } else if (heapUsage < 0.80) {
      targetReductionRatio = 0.5; // Keep 50% of messages  
    } else if (heapUsage < 0.90) {
      targetReductionRatio = 0.3; // Keep 30% of messages
    } else {
      targetReductionRatio = 0.2; // Emergency: keep only 20% of messages
    }
    
    // Calculate how many recent messages to keep
    const targetRecentMessages = Math.floor(totalMessages * targetReductionRatio);
    const minRecentMessages = Math.max(5, Math.min(15, totalMessages)); // Never less than 5, never more than 15
    
    const recentMessagesToKeep = Math.max(minRecentMessages, targetRecentMessages);
    
    logger.debug('Summarization threshold calculated', {
      totalMessages,
      heapUsage: `${(heapUsage * 100).toFixed(1)}%`,
      targetReductionRatio,
      recentMessagesToKeep,
      messagesWillSummarize: totalMessages - recentMessagesToKeep
    });
    
    return recentMessagesToKeep;
  }

  /**
   * Get current heap usage percentage - SIMPLIFIED (NO V8 IMPORT)
   */
  private getHeapUsagePercentage(): number {
    const memUsage = process.memoryUsage();
    
    // SIMPLIFIED: Use process.memoryUsage() only (no v8 import needed)
    const heapUsed = memUsage.heapUsed;
    const heapTotal = memUsage.heapTotal;
    
    // Conservative estimation: assume max heap is 2x current heap total or 2GB minimum
    const estimatedMaxHeap = Math.max(heapTotal * 2, 2 * 1024 * 1024 * 1024); // At least 2GB
    const usageRatio = heapUsed / estimatedMaxHeap;
    
    logger.debug('Simplified heap usage calculated', {
      heapUsed: `${Math.round(heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(heapTotal / 1024 / 1024)}MB`,
      estimatedMaxHeap: `${Math.round(estimatedMaxHeap / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      usagePercentage: `${(usageRatio * 100).toFixed(1)}%`,
      method: 'process.memoryUsage simplified'
    });
    
    return usageRatio;
  }

  /**
   * Check if messages exceed safety limits
   */
  exceedsSafetyLimits(messages: BaseMessageLike[]): boolean {
    const totalSize = this.estimateMessagesSize(messages);
    const MAX_SAFE_SIZE = 500 * 1024; // 500KB as safety limit
    
    return totalSize > MAX_SAFE_SIZE;
  }

  /**
   * Estimate total size of messages in bytes
   */
  private estimateMessagesSize(messages: BaseMessageLike[]): number {
    let totalSize = 0;
    
    messages.forEach(message => {
      const content = this.analyzer['getMessageContent'](message);
      totalSize += Buffer.byteLength(content, 'utf8');
    });
    
    return totalSize;
  }
}
