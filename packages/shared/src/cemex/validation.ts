/**
 * CEMEX Configuration Console - Shared Validation Functions
 * Common validation functions used across frontend and backend components
 */

import { z } from "zod";
import {
  CemexRole,
  CemexRegion,
  CemexEnvironment,
  ParameterType,
  MaintenanceType,
  TranslationContext,
  ValidationError,
  ValidationResult,
  ConfigurationParameter,
  Translation,
  AppKey,
  MaintenanceWindow,
} from "./types";
import {
  CEMEX_ROLES,
  CEMEX_REGIONS,
  CEMEX_ENVIRONMENTS,
  PARAMETER_TYPES,
  MAINTENANCE_TYPES,
  TRANSLATION_CONTEXTS,
  SUPPORTED_LANGUAGES,
  VALIDATION_CONSTRAINTS,
  ENVIRONMENT_HIERARCHY,
} from "./constants";

// Base validation schemas
export const cemexRoleSchema = z.enum([
  CEMEX_ROLES.CONSOLE_ADMIN,
  CEMEX_ROLES.TECHNICAL,
  CEMEX_ROLES.GUEST,
] as [CemexRole, ...CemexRole[]]);

export const cemexRegionSchema = z.enum([
  CEMEX_REGIONS.AME,
  CEMEX_REGIONS.EUR,
] as [CemexRegion, ...CemexRegion[]]);

export const cemexEnvironmentSchema = z.enum([
  CEMEX_ENVIRONMENTS.QA,
  CEMEX_ENVIRONMENTS.PROD,
  CEMEX_ENVIRONMENTS.DEMO,
  CEMEX_ENVIRONMENTS.DEV,
  CEMEX_ENVIRONMENTS.DEV2,
  CEMEX_ENVIRONMENTS.QA2,
  CEMEX_ENVIRONMENTS.PRE_PROD,
] as [CemexEnvironment, ...CemexEnvironment[]]);

export const parameterTypeSchema = z.enum([
  PARAMETER_TYPES.STRING,
  PARAMETER_TYPES.INTEGER,
  PARAMETER_TYPES.DECIMAL,
  PARAMETER_TYPES.BOOLEAN,
  PARAMETER_TYPES.JSON,
] as [ParameterType, ...ParameterType[]]);

export const maintenanceTypeSchema = z.enum([
  MAINTENANCE_TYPES.SCHEDULED,
  MAINTENANCE_TYPES.EMERGENCY,
  MAINTENANCE_TYPES.HOTFIX,
  MAINTENANCE_TYPES.UPGRADE,
] as [MaintenanceType, ...MaintenanceType[]]);

// Configuration Parameter validation
export const configurationParameterSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  paramKey: z
    .string()
    .min(VALIDATION_CONSTRAINTS.PARAMETER_KEY.MIN_LENGTH, "Parameter key is required")
    .max(VALIDATION_CONSTRAINTS.PARAMETER_KEY.MAX_LENGTH, "Parameter key too long")
    .regex(VALIDATION_CONSTRAINTS.PARAMETER_KEY.PATTERN, "Parameter key must contain only uppercase letters, numbers, and underscores"),
  paramValue: z.string().optional(),
  paramType: parameterTypeSchema.default(PARAMETER_TYPES.STRING),
  environment: cemexEnvironmentSchema,
  region: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateConfigurationParameterSchema = configurationParameterSchema.partial().extend({
  id: z.string().min(1, "Parameter ID is required"),
});

// Translation validation
export const translationSchema = z.object({
  translationKey: z
    .string()
    .min(VALIDATION_CONSTRAINTS.TRANSLATION_KEY.MIN_LENGTH, "Translation key is required")
    .max(VALIDATION_CONSTRAINTS.TRANSLATION_KEY.MAX_LENGTH, "Translation key too long")
    .regex(VALIDATION_CONSTRAINTS.TRANSLATION_KEY.PATTERN, "Translation key must contain only uppercase letters, numbers, and underscores"),
  languageCode: z
    .string()
    .min(VALIDATION_CONSTRAINTS.LANGUAGE_CODE.MIN_LENGTH, "Language code is required")
    .max(VALIDATION_CONSTRAINTS.LANGUAGE_CODE.MAX_LENGTH, "Language code too long")
    .regex(VALIDATION_CONSTRAINTS.LANGUAGE_CODE.PATTERN, "Invalid language code format"),
  translationValue: z.string().min(1, "Translation value is required"),
  context: z.string().optional(),
  environment: cemexEnvironmentSchema,
  region: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateTranslationSchema = translationSchema.partial().extend({
  id: z.string().min(1, "Translation ID is required"),
});

// App Key validation
export const appKeySchema = z.object({
  appName: z
    .string()
    .min(VALIDATION_CONSTRAINTS.APP_NAME.MIN_LENGTH, "Application name is required")
    .max(VALIDATION_CONSTRAINTS.APP_NAME.MAX_LENGTH, "Application name too long"),
  keyName: z
    .string()
    .min(VALIDATION_CONSTRAINTS.KEY_NAME.MIN_LENGTH, "Key name is required")
    .max(VALIDATION_CONSTRAINTS.KEY_NAME.MAX_LENGTH, "Key name too long"),
  keyValue: z.string().optional(),
  environment: cemexEnvironmentSchema,
  region: z.string().optional(),
  expiresAt: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), "Invalid expiration date"),
  isActive: z.boolean().default(true),
});

export const updateAppKeySchema = appKeySchema.partial().extend({
  id: z.string().min(1, "App key ID is required"),
});

// Maintenance Window validation
export const maintenanceWindowSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_CONSTRAINTS.MAINTENANCE_TITLE.MIN_LENGTH, "Title is required")
    .max(VALIDATION_CONSTRAINTS.MAINTENANCE_TITLE.MAX_LENGTH, "Title too long"),
  description: z.string().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start time"),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end time"),
  environment: cemexEnvironmentSchema,
  region: z.string().optional(),
  affectedServices: z.array(z.string()).optional(),
  maintenanceType: maintenanceTypeSchema,
  isActive: z.boolean().default(true),
  notifyUsers: z.boolean().default(true),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const updateMaintenanceWindowSchema = maintenanceWindowSchema.partial().extend({
  id: z.string().min(1, "Maintenance window ID is required"),
});

// Service validation
export const serviceSchema = z.object({
  serviceName: z
    .string()
    .min(VALIDATION_CONSTRAINTS.SERVICE_NAME.MIN_LENGTH, "Service name is required")
    .max(VALIDATION_CONSTRAINTS.SERVICE_NAME.MAX_LENGTH, "Service name too long"),
  serviceCode: z
    .string()
    .min(VALIDATION_CONSTRAINTS.SERVICE_CODE.MIN_LENGTH, "Service code is required")
    .max(VALIDATION_CONSTRAINTS.SERVICE_CODE.MAX_LENGTH, "Service code too long")
    .regex(VALIDATION_CONSTRAINTS.SERVICE_CODE.PATTERN, "Service code must contain only uppercase letters, numbers, and underscores"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Validation utility functions
export function validateParameterValue(value: string, type: ParameterType): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value) {
    return { isValid: true, errors }; // Optional field
  }

  switch (type) {
    case PARAMETER_TYPES.INTEGER:
      if (!/^-?\d+$/.test(value)) {
        errors.push({
          field: "paramValue",
          message: "Must be a valid integer",
          code: "INVALID_INTEGER",
        });
      }
      break;

    case PARAMETER_TYPES.DECIMAL:
      if (!/^-?\d+(\.\d+)?$/.test(value)) {
        errors.push({
          field: "paramValue",
          message: "Must be a valid decimal number",
          code: "INVALID_DECIMAL",
        });
      }
      break;

    case PARAMETER_TYPES.BOOLEAN:
      if (!/^(true|false)$/i.test(value)) {
        errors.push({
          field: "paramValue",
          message: "Must be 'true' or 'false'",
          code: "INVALID_BOOLEAN",
        });
      }
      break;

    case PARAMETER_TYPES.JSON:
      try {
        JSON.parse(value);
      } catch {
        errors.push({
          field: "paramValue",
          message: "Must be valid JSON",
          code: "INVALID_JSON",
        });
      }
      break;

    case PARAMETER_TYPES.STRING:
    default:
      // String values are always valid
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLanguageCode(languageCode: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!languageCode) {
    errors.push({
      field: "languageCode",
      message: "Language code is required",
      code: "REQUIRED",
    });
    return { isValid: false, errors };
  }

  // Check if it's a supported language
  const supportedCodes = Object.values(SUPPORTED_LANGUAGES);
  if (!supportedCodes.includes(languageCode as any)) {
    errors.push({
      field: "languageCode",
      message: `Unsupported language code. Supported codes: ${supportedCodes.join(", ")}`,
      code: "UNSUPPORTED_LANGUAGE",
    });
  }

  // Check format (ISO 639-1)
  if (!VALIDATION_CONSTRAINTS.LANGUAGE_CODE.PATTERN.test(languageCode)) {
    errors.push({
      field: "languageCode",
      message: "Invalid language code format. Use ISO 639-1 format (e.g., 'en', 'es')",
      code: "INVALID_FORMAT",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateEnvironmentHierarchy(
  fileEnvironment: CemexEnvironment,
  currentEnvironment: CemexEnvironment
): ValidationResult {
  const errors: ValidationError[] = [];

  const fileLevel = ENVIRONMENT_HIERARCHY[fileEnvironment];
  const currentLevel = ENVIRONMENT_HIERARCHY[currentEnvironment];

  if (fileLevel === undefined) {
    errors.push({
      field: "fileEnvironment",
      message: `Invalid file environment: ${fileEnvironment}`,
      code: "INVALID_ENVIRONMENT",
    });
  }

  if (currentLevel === undefined) {
    errors.push({
      field: "currentEnvironment",
      message: `Invalid current environment: ${currentEnvironment}`,
      code: "INVALID_ENVIRONMENT",
    });
  }

  if (fileLevel !== undefined && currentLevel !== undefined && fileLevel > currentLevel) {
    errors.push({
      field: "environment",
      message: `Cannot import from ${fileEnvironment} (level ${fileLevel}) to ${currentEnvironment} (level ${currentLevel})`,
      code: "INVALID_HIERARCHY",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateExcelFileName(fileName: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Check file extension
  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    errors.push({
      field: "fileName",
      message: "File must be an Excel file (.xlsx or .xls)",
      code: "INVALID_EXTENSION",
    });
  }

  // Check CEMEX naming convention
  const pattern = /^CEMEX_[A-Z_]+_[A-Z0-9-]+(_[A-Z]+)?(_[A-Z0-9_]+)?_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx?$/;
  if (!pattern.test(fileName)) {
    errors.push({
      field: "fileName",
      message: "File name must follow CEMEX naming convention: CEMEX_[MODULE]_[ENVIRONMENT]_[REGION]_[SERVICE]_[TIMESTAMP].xlsx",
      code: "INVALID_NAMING_CONVENTION",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateMaintenanceWindowOverlap(
  newWindow: { startTime: string; endTime: string; environment: CemexEnvironment },
  existingWindows: MaintenanceWindow[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  const newStart = new Date(newWindow.startTime);
  const newEnd = new Date(newWindow.endTime);

  // Check for overlaps with existing windows in the same environment
  const overlappingWindows = existingWindows.filter((window) => {
    if (window.environment !== newWindow.environment || !window.isActive) {
      return false;
    }

    const existingStart = new Date(window.startTime);
    const existingEnd = new Date(window.endTime);

    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });

  if (overlappingWindows.length > 0) {
    const overlappingTitles = overlappingWindows.map(w => w.title).join(", ");
    errors.push({
      field: "timeRange",
      message: `Maintenance window overlaps with existing windows: ${overlappingTitles}`,
      code: "MAINTENANCE_OVERLAP",
    });
  }

  // Check if maintenance is scheduled too close to another window
  const nearbyWindows = existingWindows.filter((window) => {
    if (window.environment !== newWindow.environment || !window.isActive) {
      return false;
    }

    const existingStart = new Date(window.startTime);
    const existingEnd = new Date(window.endTime);
    const bufferTime = 30 * 60 * 1000; // 30 minutes buffer

    return (
      Math.abs(newStart.getTime() - existingEnd.getTime()) < bufferTime ||
      Math.abs(newEnd.getTime() - existingStart.getTime()) < bufferTime
    );
  });

  if (nearbyWindows.length > 0) {
    const nearbyTitles = nearbyWindows.map(w => w.title).join(", ");
    warnings.push(`Maintenance window is scheduled close to: ${nearbyTitles}. Consider adding buffer time.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateProductionMaintenance(
  maintenanceWindow: { startTime: string; environment: CemexEnvironment; maintenanceType: MaintenanceType }
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (maintenanceWindow.environment === CEMEX_ENVIRONMENTS.PROD) {
    const startTime = new Date(maintenanceWindow.startTime);
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Require at least 24 hours notice for production maintenance (except emergency)
    if (hoursUntilStart < 24 && maintenanceWindow.maintenanceType !== MAINTENANCE_TYPES.EMERGENCY) {
      errors.push({
        field: "startTime",
        message: "Production maintenance requires 24 hours advance notice, except for emergency maintenance",
        code: "INSUFFICIENT_NOTICE",
      });
    }

    // Warn about production maintenance
    warnings.push("This is a production maintenance window. Ensure all stakeholders are notified.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateKeyExpiration(expiresAt?: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (!expiresAt) {
    return { isValid: true, errors, warnings };
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();

  // Check if expiration date is in the past
  if (expirationDate <= now) {
    errors.push({
      field: "expiresAt",
      message: "Expiration date must be in the future",
      code: "EXPIRED",
    });
  }

  // Warn if key expires within 30 days
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (expirationDate <= thirtyDaysFromNow) {
    warnings.push("This key will expire within 30 days. Consider renewing it.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Duplicate validation functions
export function validateUniqueParameter(
  parameter: { serviceId: string; paramKey: string; environment: CemexEnvironment; region?: string },
  existingParameters: ConfigurationParameter[],
  excludeId?: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const duplicate = existingParameters.find(
    (p) =>
      p.id !== excludeId &&
      p.serviceId === parameter.serviceId &&
      p.paramKey === parameter.paramKey &&
      p.environment === parameter.environment &&
      (p.region || "") === (parameter.region || "")
  );

  if (duplicate) {
    errors.push({
      field: "paramKey",
      message: "The Registry already exists for this service, environment, and region combination",
      code: "DUPLICATE_PARAMETER",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUniqueTranslation(
  translation: { translationKey: string; languageCode: string; environment: CemexEnvironment; region?: string },
  existingTranslations: Translation[],
  excludeId?: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const duplicate = existingTranslations.find(
    (t) =>
      t.id !== excludeId &&
      t.translationKey === translation.translationKey &&
      t.languageCode === translation.languageCode &&
      t.environment === translation.environment &&
      (t.region || "") === (translation.region || "")
  );

  if (duplicate) {
    errors.push({
      field: "translationKey",
      message: "The Translation already exists for this key, language, environment, and region combination",
      code: "DUPLICATE_TRANSLATION",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUniqueAppKey(
  appKey: { appName: string; keyName: string; environment: CemexEnvironment; region?: string },
  existingAppKeys: AppKey[],
  excludeId?: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const duplicate = existingAppKeys.find(
    (k) =>
      k.id !== excludeId &&
      k.appName === appKey.appName &&
      k.keyName === appKey.keyName &&
      k.environment === appKey.environment &&
      (k.region || "") === (appKey.region || "")
  );

  if (duplicate) {
    errors.push({
      field: "keyName",
      message: "The App Key already exists for this application, key name, environment, and region combination",
      code: "DUPLICATE_APP_KEY",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Comprehensive validation function
export function validateEntity<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  customValidations?: ((data: T) => ValidationResult)[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Schema validation
  const schemaResult = schema.safeParse(data);
  if (!schemaResult.success) {
    schemaResult.error.errors.forEach((error) => {
      errors.push({
        field: error.path.join("."),
        message: error.message,
        code: error.code,
      });
    });
  }

  // Custom validations
  if (schemaResult.success && customValidations) {
    for (const validation of customValidations) {
      const result = validation(schemaResult.data);
      errors.push(...result.errors);
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
