import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { BindToolsInput } from "@langchain/core/language_models/chat_models";
import { Provider } from "./model-manager.js";
import { createLogger, LogLevel } from "../logger.js";
import { IntelligentContextManager } from "../intelligent-context-manager.js";

const logger = createLogger(LogLevel.DEBUG, "ProviderAdapters");

export interface ProviderContextConfig {
  maxTokens: number;
  maxMessages: number;
  maxToolOutputs: number;
  compressOldContext: boolean;
  truncateToolSchemas: boolean;
  useIntelligentSummarization: boolean; // Nueva opción para resumen inteligente
}

export const PROVIDER_CONFIGS: Record<Provider, ProviderContextConfig> = {
  "google-genai": {
    maxTokens: 2000000,     // Gemini 2.5 Pro tiene 2M tokens (MÁXIMO)
    maxMessages: 1000,      // Sin limitaciones - usar toda la ventana
    maxToolOutputs: 500,    // Sin limitaciones - máximo posible
    compressOldContext: false,  // NO comprimir - usar contexto completo
    truncateToolSchemas: false, // NO truncar - tools completos
    useIntelligentSummarization: true, // REACTIVADO - problemas corregidos
  },
  "anthropic": {
    maxTokens: 200000,      // Claude 4.1 Opus tiene 200K tokens
    maxMessages: 100,       // Más mensajes que antes
    maxToolOutputs: 50,     // Más outputs que antes
    compressOldContext: false,  // NO comprimir
    truncateToolSchemas: false, // NO truncar
    useIntelligentSummarization: true, // REACTIVADO - problemas corregidos
  },
  "openai": {
    maxTokens: 400000,      // GPT-5 tiene 400K tokens en API
    maxMessages: 150,       // Más mensajes que antes
    maxToolOutputs: 75,     // Más outputs que antes
    compressOldContext: false,  // NO comprimir
    truncateToolSchemas: false, // NO truncar
    useIntelligentSummarization: true, // REACTIVADO - problemas corregidos
  },
};

export class ProviderContextAdapter {
  private provider: Provider;
  private config: ProviderContextConfig;
  private intelligentManager: IntelligentContextManager;

  constructor(provider: Provider) {
    this.provider = provider;
    this.config = PROVIDER_CONFIGS[provider];
    this.intelligentManager = new IntelligentContextManager();
  }

  async adaptContext(input: BaseMessageLike[]): Promise<BaseMessageLike[]> {
    logger.debug(`Adapting context for provider: ${this.provider}`, {
      originalLength: input.length,
      maxMessages: this.config.maxMessages,
      useIntelligentSummarization: this.config.useIntelligentSummarization,
    });

    // PRIORIDAD 1: Usar resumen inteligente basado en memoria si está habilitado
    if (this.config.useIntelligentSummarization) {
      logger.debug(`Using intelligent context summarization for provider: ${this.provider}`);
      return await this.intelligentManager.adaptPrompt(input, this.provider);
    }

    // PRIORIDAD 2: Lógica original (fallback)
    // Si no necesitamos comprimir ni truncar, devolver input original
    if (!this.config.compressOldContext && !this.config.truncateToolSchemas) {
      logger.debug(`No adaptation needed for provider: ${this.provider}`);
      return input;
    }

    // Si hay pocos mensajes, no adaptar
    if (input.length <= 3) {
      logger.debug(`Not adapting context - too few messages: ${input.length}`);
      return input;
    }

    // Siempre mantener el system prompt completo
    const systemMessages = input.filter(msg => 
      typeof msg === 'string' ? msg.includes('system') : 
      'content' in msg && typeof msg.content === 'string' && msg.content.includes('system')
    );

    // Obtener mensajes recientes
    const recentMessages = this.getRecentMessages(input, this.config.maxMessages);

    // Combinar system + recent
    const adaptedContext = [...systemMessages, ...recentMessages];

    logger.debug(`Context adapted (fallback method)`, {
      provider: this.provider,
      originalLength: input.length,
      adaptedLength: adaptedContext.length,
    });

    return adaptedContext;
  }

  adaptTools(tools: BindToolsInput[]): BindToolsInput[] {
    if (!this.config.truncateToolSchemas) {
      return tools; // Mantener tools completos para OpenAI y Anthropic
    }

    // Para Google, simplificar tool schemas
    return tools.map(tool => this.simplifyToolSchema(tool));
  }

  private getRecentMessages(messages: BaseMessageLike[], maxCount: number): BaseMessageLike[] {
    // Filtrar mensajes del sistema
    const nonSystemMessages = messages.filter(msg => 
      typeof msg === 'string' ? !msg.includes('system') : 
      'content' in msg && typeof msg.content === 'string' && !msg.content.includes('system')
    );

    // Tomar los últimos N mensajes
    return nonSystemMessages.slice(-maxCount);
  }

  private simplifyToolSchema(tool: BindToolsInput): BindToolsInput {
    if (typeof tool === 'string') {
      return tool;
    }

    // Simplificar schema para Google
    return {
      ...tool,
      schema: {
        ...tool.schema,
        description: tool.schema.description?.substring(0, 200) + '...',
        examples: tool.schema.examples?.slice(0, 1), // Solo un ejemplo
      },
    };
  }

  getMaxTokens(): number {
    return this.config.maxTokens;
  }

  getConfig(): ProviderContextConfig {
    return this.config;
  }

  shouldCompressOldContext(): boolean {
    return this.config.compressOldContext;
  }
}

export function createProviderAdapter(provider: Provider): ProviderContextAdapter {
  return new ProviderContextAdapter(provider);
}
