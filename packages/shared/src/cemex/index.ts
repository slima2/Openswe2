/**
 * CEMEX Configuration Console - Shared Package
 * Main export file for all CEMEX shared utilities, types, constants, and business logic
 */

// Export all types
export * from "./types.js";

// Export all constants
export * from "./constants.js";

// Export all validation functions and schemas
export * from "./validation.js";

// Export all utility functions
export * from "./utils.js";

// Re-export commonly used items for convenience
export {
  // Core types
  type CemexUser,
  type CemexRole,
  type CemexRegion,
  type CemexEnvironment,
  type CemexPermissions,
  
  // Entity types
  type ConfigurationParameter,
  type Translation,
  type AppKey,
  type MaintenanceWindow,
  type Service,
  type AuditLog,
  
  // Form data types
  type ParameterFormData,
  type TranslationFormData,
  type AppKeyFormData,
  type MaintenanceWindowFormData,
  
  // API response types
  type CemexApiResponse,
  type CemexPaginatedResponse,
  type ImportResult,
  type ValidationResult,
  
  // Enums
  CemexModule,
  AuditAction,
  
  // Error classes
  CemexError,
  CemexValidationError,
  CemexAuthenticationError,
  CemexAuthorizationError,
} from "./types.js";

export {
  // Role constants
  CEMEX_ROLES,
  CEMEX_ROLE_HIERARCHY,
  
  // Environment constants
  CEMEX_ENVIRONMENTS,
  CEMEX_ENVIRONMENT_LABELS,
  ENVIRONMENT_HIERARCHY,
  
  // Region constants
  CEMEX_REGIONS,
  CEMEX_REGION_LABELS,
  
  // Parameter type constants
  PARAMETER_TYPES,
  PARAMETER_TYPE_LABELS,
  
  // Maintenance type constants
  MAINTENANCE_TYPES,
  MAINTENANCE_TYPE_LABELS,
  
  // Translation context constants
  TRANSLATION_CONTEXTS,
  TRANSLATION_CONTEXT_LABELS,
  
  // Language constants
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  
  // Message constants
  CEMEX_MESSAGES,
  MESSAGE_DURATIONS,
  
  // Validation constraints
  VALIDATION_CONSTRAINTS,
  
  // API endpoints
  API_ENDPOINTS,
  
  // Route paths
  ROUTE_PATHS,
  
  // File upload constraints
  FILE_UPLOAD,
  
  // Excel file naming
  EXCEL_FILE_NAMING,
  
  // Pagination defaults
  PAGINATION,
  
  // Environment and role colors
  ENVIRONMENT_COLORS,
  ROLE_COLORS,
  
  // Feature flags
  FEATURE_FLAGS,
  
  // Default values
  DEFAULTS,
} from "./constants.js";

export {
  // Validation schemas
  cemexRoleSchema,
  cemexRegionSchema,
  cemexEnvironmentSchema,
  parameterTypeSchema,
  maintenanceTypeSchema,
  configurationParameterSchema,
  updateConfigurationParameterSchema,
  translationSchema,
  updateTranslationSchema,
  appKeySchema,
  updateAppKeySchema,
  maintenanceWindowSchema,
  updateMaintenanceWindowSchema,
  serviceSchema,
  
  // Validation functions
  validateParameterValue,
  validateLanguageCode,
  validateEnvironmentHierarchy,
  validateExcelFileName,
  validateMaintenanceWindowOverlap,
  validateProductionMaintenance,
  validateKeyExpiration,
  validateUniqueParameter,
  validateUniqueTranslation,
  validateUniqueAppKey,
  validateEntity,
} from "./validation.js";

export {
  // Permission utilities
  hasRole,
  canPerformImportExport,
  canPerformCRUD,
  hasReadAccess,
  getUserPermissions,
  getRoleHierarchyLevel,
  hasHigherOrEqualRole,
  
  // Environment utilities
  getEnvironmentHierarchyLevel,
  canImportToEnvironment,
  isProductionEnvironment,
  getEnvironmentRiskLevel,
  
  // Parameter utilities
  formatParameterValue,
  validateParameterValueFormat,
  getParameterTypeIcon,
  
  // Key masking utilities
  maskKeyValue,
  shouldMaskKeyValue,
  
  // Date and time utilities
  formatDateTime,
  formatDate,
  formatTime,
  getRelativeTime,
  isExpiringSoon,
  isExpired,
  
  // Maintenance window utilities
  getMaintenanceStatus,
  getMaintenanceDuration,
  getMaintenanceTypeColor,
  
  // File naming utilities
  generateExcelFileName,
  parseExcelFileName,
  
  // Message utilities
  getMessageDuration,
  getCemexMessage,
  
  // Search and filter utilities
  filterParameters,
  filterTranslations,
  filterAppKeys,
  filterMaintenanceWindows,
  
  // Sorting utilities
  sortByDate,
  sortByName,
  
  // Pagination utilities
  paginateItems,
  
  // General utilities
  generateId,
  deepClone,
  debounce,
  throttle,
} from "./utils.js";

// Default export for convenience
const CEMEX = {
  // Types (not exported in default as they're type-only)
  
  // Constants
  ROLES: CEMEX_ROLES,
  ENVIRONMENTS: CEMEX_ENVIRONMENTS,
  REGIONS: CEMEX_REGIONS,
  PARAMETER_TYPES,
  MAINTENANCE_TYPES,
  MESSAGES: CEMEX_MESSAGES,
  
  // Validation
  validate: {
    parameterValue: validateParameterValue,
    languageCode: validateLanguageCode,
    environmentHierarchy: validateEnvironmentHierarchy,
    excelFileName: validateExcelFileName,
    maintenanceWindowOverlap: validateMaintenanceWindowOverlap,
    productionMaintenance: validateProductionMaintenance,
    keyExpiration: validateKeyExpiration,
    uniqueParameter: validateUniqueParameter,
    uniqueTranslation: validateUniqueTranslation,
    uniqueAppKey: validateUniqueAppKey,
    entity: validateEntity,
  },
  
  // Utilities
  utils: {
    // Permission utilities
    hasRole,
    canPerformImportExport,
    canPerformCRUD,
    hasReadAccess,
    getUserPermissions,
    
    // Environment utilities
    getEnvironmentHierarchyLevel,
    canImportToEnvironment,
    isProductionEnvironment,
    getEnvironmentRiskLevel,
    
    // Parameter utilities
    formatParameterValue,
    validateParameterValueFormat,
    getParameterTypeIcon,
    
    // Key masking utilities
    maskKeyValue,
    shouldMaskKeyValue,
    
    // Date and time utilities
    formatDateTime,
    formatDate,
    formatTime,
    getRelativeTime,
    isExpiringSoon,
    isExpired,
    
    // Maintenance window utilities
    getMaintenanceStatus,
    getMaintenanceDuration,
    getMaintenanceTypeColor,
    
    // File naming utilities
    generateExcelFileName,
    parseExcelFileName,
    
    // Message utilities
    getMessageDuration,
    getCemexMessage,
    
    // Search and filter utilities
    filterParameters,
    filterTranslations,
    filterAppKeys,
    filterMaintenanceWindows,
    
    // Sorting utilities
    sortByDate,
    sortByName,
    
    // Pagination utilities
    paginateItems,
    
    // General utilities
    generateId,
    deepClone,
    debounce,
    throttle,
  },
};

export default CEMEX;


