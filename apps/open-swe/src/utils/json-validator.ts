import { createLogger, LogLevel } from "./logger.js";

const logger = createLogger(LogLevel.INFO, "JSONValidator");

export interface ValidationResult {
  valid: boolean;
  error?: string;
  fixedContent?: string;
  suggestions: string[];
}

/**
 * Validador y reparador de JSON para prevenir errores de sintaxis
 */
export class JSONValidator {
  
  /**
   * Validar y reparar JSON si es necesario
   */
  validateAndFix(content: string): ValidationResult {
    const result: ValidationResult = {
      valid: false,
      suggestions: [],
    };

    try {
      // Intento de parsing directo
      JSON.parse(content);
      result.valid = true;
      return result;
    } catch (error: any) {
      logger.debug("JSON validation failed, attempting repair", { 
        error: error.message 
      });
      
      return this.attemptRepair(content, error);
    }
  }

  /**
   * Intentar reparar JSON malformado
   */
  private attemptRepair(content: string, originalError: Error): ValidationResult {
    const repairs = [
      () => this.fixTrailingCommas(content),
      () => this.fixMissingQuotes(content),
      () => this.fixUnbalancedBraces(content),
      () => this.fixTruncatedString(content),
      () => this.createMinimalValidJSON(content),
    ];

    for (const repair of repairs) {
      try {
        const repaired = repair();
        JSON.parse(repaired); // Validate the repair
        
        logger.info("JSON successfully repaired", {
          originalError: originalError.message,
          repairMethod: repair.name,
        });
        
        return {
          valid: true,
          fixedContent: repaired,
          suggestions: [`Repaired using ${repair.name}`],
        };
      } catch (repairError) {
        // Continue to next repair method
        continue;
      }
    }

    // All repair attempts failed
    return {
      valid: false,
      error: originalError.message,
      suggestions: [
        'JSON is severely malformed and cannot be automatically repaired',
        'Consider using a smaller truncation size',
        'Check the original data source for corruption',
      ],
    };
  }

  /**
   * Reparar comas finales
   */
  private fixTrailingCommas(content: string): string {
    return content
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas before } or ]
      .replace(/,(\s*$)/g, ''); // Remove trailing commas at end of string
  }

  /**
   * Reparar comillas faltantes en keys
   */
  private fixMissingQuotes(content: string): string {
    // Fix unquoted object keys
    return content.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  }

  /**
   * Reparar llaves/brackets desbalanceados
   */
  private fixUnbalancedBraces(content: string): string {
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;

    let fixed = content;

    // Add missing closing braces
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      fixed += '}'.repeat(missing);
    }

    // Add missing closing brackets
    if (openBrackets > closeBrackets) {
      const missing = openBrackets - closeBrackets;
      fixed += ']'.repeat(missing);
    }

    // Remove extra closing braces/brackets (more complex, basic implementation)
    if (closeBraces > openBraces || closeBrackets > openBrackets) {
      // Try to remove from the end
      const extraBraces = Math.max(0, closeBraces - openBraces);
      const extraBrackets = Math.max(0, closeBrackets - openBrackets);
      
      for (let i = 0; i < extraBraces; i++) {
        const lastBrace = fixed.lastIndexOf('}');
        if (lastBrace !== -1) {
          fixed = fixed.substring(0, lastBrace) + fixed.substring(lastBrace + 1);
        }
      }
      
      for (let i = 0; i < extraBrackets; i++) {
        const lastBracket = fixed.lastIndexOf(']');
        if (lastBracket !== -1) {
          fixed = fixed.substring(0, lastBracket) + fixed.substring(lastBracket + 1);
        }
      }
    }

    return fixed;
  }

  /**
   * Reparar string truncado
   */
  private fixTruncatedString(content: string): string {
    let fixed = content.trim();
    
    // If content ends abruptly in the middle of a string, close it
    if (fixed.endsWith('"') === false) {
      // Find the last opening quote
      const lastQuote = fixed.lastIndexOf('"');
      if (lastQuote !== -1) {
        // Check if this quote is escaped
        let isEscaped = false;
        let pos = lastQuote - 1;
        while (pos >= 0 && fixed[pos] === '\\') {
          isEscaped = !isEscaped;
          pos--;
        }
        
        if (!isEscaped) {
          // Add closing quote
          fixed += '"';
        }
      }
    }

    return fixed;
  }

  /**
   * Crear JSON mínimo válido cuando todo falla
   */
  private createMinimalValidJSON(content: string): string {
    const trimmed = content.trim();
    
    // Try to preserve the basic structure
    if (trimmed.startsWith('{')) {
      return '{"data": "[Original JSON was malformed and truncated]", "error": "truncated"}';
    } else if (trimmed.startsWith('[')) {
      return '["[Original array was malformed and truncated]"]';
    } else {
      return '"[Original content was not valid JSON]"';
    }
  }

  /**
   * Validar JSON específicamente para truncamiento
   */
  validateForTruncation(content: string, maxSize: number): {
    canTruncate: boolean;
    suggestedTruncationPoint?: number;
    reason?: string;
  } {
    try {
      const parsed = JSON.parse(content);
      
      // For arrays, we can safely truncate elements
      if (Array.isArray(parsed)) {
        return {
          canTruncate: true,
          suggestedTruncationPoint: this.findArrayTruncationPoint(content, maxSize),
        };
      }
      
      // For objects, we can remove properties
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          canTruncate: true,
          suggestedTruncationPoint: this.findObjectTruncationPoint(content, maxSize),
        };
      }
      
      return {
        canTruncate: false,
        reason: 'JSON is a primitive value and cannot be safely truncated',
      };
      
    } catch (error) {
      return {
        canTruncate: false,
        reason: 'JSON is malformed and cannot be analyzed for truncation',
      };
    }
  }

  /**
   * Encontrar punto seguro de truncamiento en array
   */
  private findArrayTruncationPoint(content: string, maxSize: number): number {
    const lines = content.split('\n');
    let currentSize = 0;
    let safePoint = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentSize += Buffer.byteLength(line + '\n', 'utf8');
      
      if (currentSize > maxSize * 0.8) { // Leave 20% buffer
        break;
      }
      
      // Look for safe truncation points (end of array elements)
      if (line.trim().endsWith(',') || line.trim().endsWith(']')) {
        safePoint = currentSize;
      }
    }
    
    return safePoint;
  }

  /**
   * Encontrar punto seguro de truncamiento en object
   */
  private findObjectTruncationPoint(content: string, maxSize: number): number {
    const lines = content.split('\n');
    let currentSize = 0;
    let safePoint = 0;
    let braceDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentSize += Buffer.byteLength(line + '\n', 'utf8');
      
      if (currentSize > maxSize * 0.8) {
        break;
      }
      
      // Track brace depth
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
      
      // Safe truncation points are at the end of complete properties
      if ((line.trim().endsWith(',') || line.trim().endsWith('}')) && braceDepth >= 0) {
        safePoint = currentSize;
      }
    }
    
    return safePoint;
  }
}

// Global validator instance
const globalValidator = new JSONValidator();

/**
 * Validar y reparar JSON
 */
export function validateAndFixJSON(content: string): ValidationResult {
  return globalValidator.validateAndFix(content);
}

/**
 * Verificar si JSON se puede truncar de forma segura
 */
export function canSafelyTruncateJSON(content: string, maxSize: number): boolean {
  const result = globalValidator.validateForTruncation(content, maxSize);
  return result.canTruncate;
}

/**
 * Wrapper para uso en truncadores
 */
export function safeJSONTruncate(content: string, maxSize: number): string {
  const validation = validateAndFixJSON(content);
  
  if (!validation.valid) {
    if (validation.fixedContent) {
      logger.warn("Using repaired JSON for truncation", {
        originalError: validation.error,
        suggestions: validation.suggestions,
      });
      content = validation.fixedContent;
    } else {
      logger.error("Cannot repair JSON for safe truncation", {
        error: validation.error,
        suggestions: validation.suggestions,
      });
      return '{"error": "JSON was malformed and could not be repaired", "original_size": ' + Buffer.byteLength(content, 'utf8') + '}';
    }
  }
  
  // Now proceed with safe truncation
  const truncationInfo = globalValidator.validateForTruncation(content, maxSize);
  
  if (!truncationInfo.canTruncate) {
    logger.warn("JSON cannot be safely truncated", { reason: truncationInfo.reason });
    return content; // Return as-is if we can't truncate safely
  }
  
  // Perform the truncation at the suggested point
  if (truncationInfo.suggestedTruncationPoint) {
    const truncated = content.substring(0, truncationInfo.suggestedTruncationPoint);
    
    // Validate the truncated result
    const finalValidation = validateAndFixJSON(truncated);
    if (finalValidation.valid) {
      return finalValidation.fixedContent || truncated;
    }
  }
  
  // Fallback to original if truncation failed
  return content;
}
