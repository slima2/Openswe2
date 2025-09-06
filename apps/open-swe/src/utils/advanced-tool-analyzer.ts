import { createLogger, LogLevel } from './logger.js';

const logger = createLogger(LogLevel.DEBUG, 'AdvancedToolAnalyzer');

export type ToolCriticalityLevel = 'ESSENTIAL' | 'IMPORTANT' | 'ROUTINE';

export interface ToolCriticality {
  level: ToolCriticalityLevel;
  reason: string;
  preserveFullContent: boolean;
  confidence: number; // 0-1 score of classification confidence
}

export interface AnalyzedTool {
  originalTool: any;
  messageIndex: number;
  criticality: ToolCriticality;
  summary?: string;
  keyElements?: {
    functions: string[];
    exports: string[];
    types: string[];
    configs: string[];
  };
}

export interface ToolAnalysisResult {
  essential: AnalyzedTool[];
  important: AnalyzedTool[];
  routine: AnalyzedTool[];
  totalAnalyzed: number;
}

/**
 * Advanced analyzer that classifies tool calls by criticality to prevent loss of important context
 */
export class AdvancedToolAnalyzer {
  /**
   * Analyze criticality of a tool call to determine preservation strategy
   */
  analyzeToolCriticality(toolCall: any): ToolCriticality {
    if (!toolCall?.function) {
      return {
        level: 'ROUTINE',
        reason: 'No function information available',
        preserveFullContent: false,
        confidence: 0.9
      };
    }

    const func = toolCall.function;
    const args = func.arguments || {};
    const path = args.path || '';
    const content = args.file_text || args.new_string || '';
    const command = args.command || '';

    // Check for ESSENTIAL tools first (highest priority)
    const essentialCheck = this.checkEssentialCriticality(path, content, command, func.name);
    if (essentialCheck.level === 'ESSENTIAL') {
      return essentialCheck;
    }

    // Check for IMPORTANT tools
    const importantCheck = this.checkImportantCriticality(path, content, command, func.name);
    if (importantCheck.level === 'IMPORTANT') {
      return importantCheck;
    }

    // Default to ROUTINE
    return {
      level: 'ROUTINE',
      reason: 'Standard file operations or minor changes',
      preserveFullContent: false,
      confidence: 0.7
    };
  }

  /**
   * Check if tool call is ESSENTIAL (never summarize)
   */
  private checkEssentialCriticality(path: string, content: string, command: string, toolName: string): ToolCriticality {
    const pathLower = path.toLowerCase();
    const contentUpper = content.toUpperCase();

    // Configuration files - ALWAYS essential
    if (this.isConfigurationFile(pathLower)) {
      return {
        level: 'ESSENTIAL',
        reason: 'Critical configuration file that affects system behavior',
        preserveFullContent: true,
        confidence: 0.95
      };
    }

    // Environment and secrets - ALWAYS essential
    if (this.containsSecretsOrEnv(contentUpper, pathLower)) {
      return {
        level: 'ESSENTIAL',
        reason: 'Contains environment variables, secrets, or sensitive configuration',
        preserveFullContent: true,
        confidence: 0.98
      };
    }

    // Database and connection configs - ALWAYS essential
    if (this.isDatabaseConfig(contentUpper, pathLower)) {
      return {
        level: 'ESSENTIAL',
        reason: 'Database configuration or connection setup',
        preserveFullContent: true,
        confidence: 0.95
      };
    }

    // Authentication and security - ALWAYS essential
    if (this.isAuthenticationCode(contentUpper, pathLower)) {
      return {
        level: 'ESSENTIAL',
        reason: 'Authentication, authorization, or security-related code',
        preserveFullContent: true,
        confidence: 0.95
      };
    }

    // API routes and middleware - ALWAYS essential
    if (this.isAPIOrMiddleware(contentUpper, pathLower)) {
      return {
        level: 'ESSENTIAL',
        reason: 'API routes, middleware, or core server functionality',
        preserveFullContent: true,
        confidence: 0.90
      };
    }

    // Build and deployment configs - ALWAYS essential
    if (this.isBuildOrDeploymentConfig(pathLower, contentUpper)) {
      return {
        level: 'ESSENTIAL',
        reason: 'Build, deployment, or infrastructure configuration',
        preserveFullContent: true,
        confidence: 0.92
      };
    }

    return { level: 'ROUTINE', reason: '', preserveFullContent: false, confidence: 0 };
  }

  /**
   * Check if tool call is IMPORTANT (structured summary allowed)
   */
  private checkImportantCriticality(path: string, content: string, command: string, toolName: string): ToolCriticality {
    const pathLower = path.toLowerCase();
    const contentUpper = content.toUpperCase();

    // Business logic components
    if (this.isBusinessLogic(contentUpper, pathLower)) {
      return {
        level: 'IMPORTANT',
        reason: 'Business logic, services, or core application functionality',
        preserveFullContent: false,
        confidence: 0.85
      };
    }

    // React components with significant logic
    if (this.isSignificantComponent(contentUpper, pathLower)) {
      return {
        level: 'IMPORTANT',
        reason: 'React component with significant logic or state management',
        preserveFullContent: false,
        confidence: 0.80
      };
    }

    // Data models and types
    if (this.isDataModelOrType(contentUpper, pathLower)) {
      return {
        level: 'IMPORTANT',
        reason: 'Data models, interfaces, or type definitions',
        preserveFullContent: false,
        confidence: 0.85
      };
    }

    // Utility functions and helpers
    if (this.isUtilityCode(contentUpper, pathLower)) {
      return {
        level: 'IMPORTANT',
        reason: 'Utility functions or helper code used across the application',
        preserveFullContent: false,
        confidence: 0.75
      };
    }

    return { level: 'ROUTINE', reason: '', preserveFullContent: false, confidence: 0 };
  }

  // ESSENTIAL Detection Methods
  private isConfigurationFile(pathLower: string): boolean {
    const configPatterns = [
      'config', '.env', 'settings', 'constants',
      'webpack', 'vite', 'rollup', 'babel',
      'tsconfig', 'package.json', 'yarn.lock',
      'docker', 'nginx', 'apache'
    ];
    return configPatterns.some(pattern => pathLower.includes(pattern));
  }

  private containsSecretsOrEnv(contentUpper: string, pathLower: string): boolean {
    const secretPatterns = [
      'PROCESS.ENV', 'API_KEY', 'SECRET', 'PASSWORD', 'TOKEN',
      'DATABASE_URL', 'MONGODB_URI', 'REDIS_URL', 'JWT_SECRET',
      'STRIPE_', 'PAYPAL_', 'GOOGLE_CLIENT', 'FACEBOOK_APP',
      'AWS_ACCESS_KEY', 'AZURE_', 'GCP_', 'OPENAI_API_KEY'
    ];
    return secretPatterns.some(pattern => contentUpper.includes(pattern)) ||
           pathLower.includes('.env') || pathLower.includes('secret');
  }

  private isDatabaseConfig(contentUpper: string, pathLower: string): boolean {
    const dbPatterns = [
      'DATABASE', 'CONNECTION', 'MONGOOSE', 'SEQUELIZE', 'PRISMA',
      'TYPEORM', 'KNEX', 'MONGODB', 'POSTGRESQL', 'MYSQL',
      'REDIS', 'CASSANDRA', 'DYNAMODB', 'FIRESTORE'
    ];
    return dbPatterns.some(pattern => contentUpper.includes(pattern)) ||
           pathLower.includes('database') || pathLower.includes('db');
  }

  private isAuthenticationCode(contentUpper: string, pathLower: string): boolean {
    const authPatterns = [
      'AUTHENTICATION', 'AUTHORIZATION', 'JWT', 'PASSPORT',
      'BCRYPT', 'HASH', 'LOGIN', 'LOGOUT', 'REGISTER',
      'OAUTH', 'SAML', 'LDAP', 'SESSION', 'COOKIE',
      'MIDDLEWARE', 'GUARD', 'ROLE', 'PERMISSION'
    ];
    return authPatterns.some(pattern => contentUpper.includes(pattern)) ||
           pathLower.includes('auth') || pathLower.includes('security');
  }

  private isAPIOrMiddleware(contentUpper: string, pathLower: string): boolean {
    const apiPatterns = [
      'APP.GET', 'APP.POST', 'APP.PUT', 'APP.DELETE',
      'ROUTER.', 'EXPRESS', 'FASTIFY', 'KOA',
      'MIDDLEWARE', 'CORS', 'HELMET', 'RATE_LIMIT',
      'API/', 'ROUTES/', 'ENDPOINTS'
    ];
    return apiPatterns.some(pattern => contentUpper.includes(pattern)) ||
           pathLower.includes('/api/') || pathLower.includes('routes') ||
           pathLower.includes('middleware');
  }

  private isBuildOrDeploymentConfig(pathLower: string, contentUpper: string): boolean {
    const buildPatterns = [
      'dockerfile', 'docker-compose', 'k8s', 'kubernetes',
      'terraform', 'ansible', 'jenkins', 'github/workflows',
      'gitlab-ci', 'azure-pipelines', 'buildspec',
      'serverless', 'vercel', 'netlify'
    ];
    return buildPatterns.some(pattern => pathLower.includes(pattern)) ||
           contentUpper.includes('DEPLOYMENT') || contentUpper.includes('BUILD_');
  }

  // IMPORTANT Detection Methods
  private isBusinessLogic(contentUpper: string, pathLower: string): boolean {
    const businessPatterns = [
      'SERVICE', 'CONTROLLER', 'MANAGER', 'HANDLER',
      'PROCESSOR', 'VALIDATOR', 'CALCULATOR', 'GENERATOR',
      'EXPORT CLASS', 'EXPORT FUNCTION', 'ASYNC FUNCTION'
    ];
    return businessPatterns.some(pattern => contentUpper.includes(pattern)) ||
           pathLower.includes('service') || pathLower.includes('controller') ||
           pathLower.includes('logic');
  }

  private isSignificantComponent(contentUpper: string, pathLower: string): boolean {
    if (!pathLower.includes('.tsx') && !pathLower.includes('.jsx')) {
      return false;
    }
    
    const componentPatterns = [
      'USESTATE', 'USEEFFECT', 'USEREDUCER', 'USECONTEXT',
      'USEMEMO', 'USECALLBACK', 'USEQUERY', 'USEMUTATION',
      'ASYNC', 'API', 'FETCH', 'AXIOS'
    ];
    return componentPatterns.some(pattern => contentUpper.includes(pattern));
  }

  private isDataModelOrType(contentUpper: string, pathLower: string): boolean {
    const modelPatterns = [
      'INTERFACE', 'TYPE ', 'ENUM ', 'CLASS ',
      'SCHEMA', 'MODEL', 'ENTITY', 'DTO',
      'EXPORT TYPE', 'EXPORT INTERFACE', 'EXPORT ENUM'
    ];
    return modelPatterns.some(pattern => contentUpper.includes(pattern)) ||
           pathLower.includes('types') || pathLower.includes('models') ||
           pathLower.includes('interfaces');
  }

  private isUtilityCode(contentUpper: string, pathLower: string): boolean {
    const utilityPatterns = [
      'EXPORT FUNCTION', 'EXPORT CONST', 'HELPER',
      'UTILITY', 'UTILS', 'COMMON', 'SHARED'
    ];
    return utilityPatterns.some(pattern => contentUpper.includes(pattern)) ||
           pathLower.includes('util') || pathLower.includes('helper') ||
           pathLower.includes('common');
  }

  /**
   * Analyze all tools from messages and categorize them
   */
  analyzeAllTools(messages: any[]): ToolAnalysisResult {
    const result: ToolAnalysisResult = {
      essential: [],
      important: [],
      routine: [],
      totalAnalyzed: 0
    };

    messages.forEach((message, messageIndex) => {
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        message.tool_calls.forEach((toolCall: any) => {
          const criticality = this.analyzeToolCriticality(toolCall);
          
          const analyzedTool: AnalyzedTool = {
            originalTool: toolCall,
            messageIndex,
            criticality,
          };

          // Add key elements extraction for non-essential tools
          if (criticality.level !== 'ESSENTIAL') {
            analyzedTool.keyElements = this.extractKeyElements(toolCall);
            analyzedTool.summary = this.createToolSummary(toolCall);
          }

          // Categorize by criticality level
          switch (criticality.level) {
            case 'ESSENTIAL':
              result.essential.push(analyzedTool);
              break;
            case 'IMPORTANT':
              result.important.push(analyzedTool);
              break;
            case 'ROUTINE':
              result.routine.push(analyzedTool);
              break;
          }

          result.totalAnalyzed++;
        });
      }
    });

    logger.info('Tool analysis completed', {
      totalAnalyzed: result.totalAnalyzed,
      essential: result.essential.length,
      important: result.important.length,
      routine: result.routine.length,
      preservationRatio: `${((result.essential.length + result.important.length) / result.totalAnalyzed * 100).toFixed(1)}%`
    });

    return result;
  }

  /**
   * Extract key elements from tool content for structured summaries
   */
  extractKeyElements(toolCall: any): { functions: string[]; exports: string[]; types: string[]; configs: string[] } {
    const content = toolCall.function?.arguments?.file_text || 
                   toolCall.function?.arguments?.new_string || '';
    
    return {
      functions: this.extractFunctions(content),
      exports: this.extractExports(content),
      types: this.extractTypes(content),
      configs: this.extractConfigs(content)
    };
  }

  /**
   * Extract function names from content
   */
  extractFunctions(content: string): string[] {
    const functions: string[] = [];
    const patterns = [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
      /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\s*\(/g,
      /(\w+)\s*:\s*(?:async\s*)?\s*\(/g // object method syntax
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !functions.includes(match[1])) {
          functions.push(match[1]);
        }
      }
    });

    return functions.slice(0, 8); // Limit to most important functions
  }

  /**
   * Extract export statements
   */
  extractExports(content: string): string[] {
    const exports: string[] = [];
    const patterns = [
      /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
      /export\s*\{\s*([^}]+)\s*\}/g,
      /export\s+\*\s+from\s+['"]([^'"]+)['"]/g
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (index === 1) { // export { ... } syntax
          const exportList = match[1].split(',').map(e => e.trim().split(' as ')[0]);
          exports.push(...exportList);
        } else {
          exports.push(match[1]);
        }
      }
    });

    return [...new Set(exports)].slice(0, 10); // Remove duplicates and limit
  }

  /**
   * Extract type definitions
   */
  extractTypes(content: string): string[] {
    const types: string[] = [];
    const patterns = [
      /(?:export\s+)?interface\s+(\w+)/g,
      /(?:export\s+)?type\s+(\w+)/g,
      /(?:export\s+)?enum\s+(\w+)/g,
      /(?:export\s+)?class\s+(\w+)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !types.includes(match[1])) {
          types.push(match[1]);
        }
      }
    });

    return types.slice(0, 6); // Limit to most important types
  }

  /**
   * Extract configuration values
   */
  extractConfigs(content: string): string[] {
    const configs: string[] = [];
    const patterns = [
      /(?:const|let|var)\s+(\w*[Cc]onfig\w*)\s*=/g,
      /(?:const|let|var)\s+(\w*[Ss]ettings?\w*)\s*=/g,
      /process\.env\.(\w+)/g,
      /(?:const|let|var)\s+([A-Z_]{3,})\s*=/g // CONSTANT_CASE variables
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !configs.includes(match[1])) {
          configs.push(match[1]);
        }
      }
    });

    return configs.slice(0, 8); // Limit to most important configs
  }

  /**
   * Create a structured summary of a tool call
   */
  createToolSummary(toolCall: any): string {
    const func = toolCall.function;
    const args = func?.arguments || {};
    const path = args.path || 'unknown';
    const command = args.command || func?.name || 'unknown';
    const keyElements = this.extractKeyElements(toolCall);

    const parts: string[] = [];
    
    parts.push(`${command} → ${path}`);
    
    if (keyElements.functions.length > 0) {
      parts.push(`Functions: [${keyElements.functions.slice(0, 3).join(', ')}${keyElements.functions.length > 3 ? '...' : ''}]`);
    }
    
    if (keyElements.types.length > 0) {
      parts.push(`Types: [${keyElements.types.slice(0, 2).join(', ')}${keyElements.types.length > 2 ? '...' : ''}]`);
    }
    
    if (keyElements.exports.length > 0) {
      parts.push(`Exports: [${keyElements.exports.slice(0, 2).join(', ')}${keyElements.exports.length > 2 ? '...' : ''}]`);
    }

    return parts.join(' | ');
  }
}
