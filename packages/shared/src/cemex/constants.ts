/**
 * CEMEX Configuration Console - Shared Constants
 * Common constants used across frontend and backend components
 */

import { CemexRole, CemexRegion, CemexEnvironment, ParameterType, MaintenanceType, TranslationContext } from "./types.js";

// CEMEX Roles
export const CEMEX_ROLES: Record<string, CemexRole> = {
  CONSOLE_ADMIN: "Console Admin",
  TECHNICAL: "Technical",
  GUEST: "Guest",
} as const;

export const CEMEX_ROLE_HIERARCHY = {
  [CEMEX_ROLES.CONSOLE_ADMIN]: 3,
  [CEMEX_ROLES.TECHNICAL]: 2,
  [CEMEX_ROLES.GUEST]: 1,
} as const;

// CEMEX Regions
export const CEMEX_REGIONS: Record<string, CemexRegion> = {
  AME: "AME",
  EUR: "EUR",
} as const;

export const CEMEX_REGION_LABELS = {
  [CEMEX_REGIONS.AME]: "AME - Americas",
  [CEMEX_REGIONS.EUR]: "EUR - Europe",
} as const;

// CEMEX Environments
export const CEMEX_ENVIRONMENTS: Record<string, CemexEnvironment> = {
  QA: "QA",
  PROD: "PROD",
  DEMO: "DEMO",
  DEV: "DEV",
  DEV2: "DEV2",
  QA2: "QA2",
  PRE_PROD: "PRE-PROD",
} as const;

export const CEMEX_ENVIRONMENT_LABELS = {
  [CEMEX_ENVIRONMENTS.QA]: "QA - Quality Assurance",
  [CEMEX_ENVIRONMENTS.PROD]: "PROD - Production",
  [CEMEX_ENVIRONMENTS.DEMO]: "DEMO - Demonstration",
  [CEMEX_ENVIRONMENTS.DEV]: "DEV - Development",
  [CEMEX_ENVIRONMENTS.DEV2]: "DEV2 - Development 2",
  [CEMEX_ENVIRONMENTS.QA2]: "QA2 - Quality Assurance 2",
  [CEMEX_ENVIRONMENTS.PRE_PROD]: "PRE-PROD - Pre-Production",
} as const;

// Environment Hierarchy (for import/export validation)
export const ENVIRONMENT_HIERARCHY = {
  [CEMEX_ENVIRONMENTS.QA]: 1,
  [CEMEX_ENVIRONMENTS.PROD]: 2,
  [CEMEX_ENVIRONMENTS.DEMO]: 3,
  [CEMEX_ENVIRONMENTS.DEV]: 3,
  [CEMEX_ENVIRONMENTS.DEV2]: 3,
  [CEMEX_ENVIRONMENTS.QA2]: 3,
  [CEMEX_ENVIRONMENTS.PRE_PROD]: 3,
} as const;

// Parameter Types
export const PARAMETER_TYPES: Record<string, ParameterType> = {
  STRING: "STRING",
  INTEGER: "INTEGER",
  DECIMAL: "DECIMAL",
  BOOLEAN: "BOOLEAN",
  JSON: "JSON",
} as const;

export const PARAMETER_TYPE_LABELS = {
  [PARAMETER_TYPES.STRING]: "String - Text values",
  [PARAMETER_TYPES.INTEGER]: "Integer - Whole numbers",
  [PARAMETER_TYPES.DECIMAL]: "Decimal - Decimal numbers",
  [PARAMETER_TYPES.BOOLEAN]: "Boolean - true/false values",
  [PARAMETER_TYPES.JSON]: "JSON - Complex objects",
} as const;

// Maintenance Types
export const MAINTENANCE_TYPES: Record<string, MaintenanceType> = {
  SCHEDULED: "SCHEDULED",
  EMERGENCY: "EMERGENCY",
  HOTFIX: "HOTFIX",
  UPGRADE: "UPGRADE",
} as const;

export const MAINTENANCE_TYPE_LABELS = {
  [MAINTENANCE_TYPES.SCHEDULED]: "Scheduled - Planned maintenance",
  [MAINTENANCE_TYPES.EMERGENCY]: "Emergency - Urgent fixes",
  [MAINTENANCE_TYPES.HOTFIX]: "Hotfix - Critical patches",
  [MAINTENANCE_TYPES.UPGRADE]: "Upgrade - System upgrades",
} as const;

// Translation Contexts
export const TRANSLATION_CONTEXTS: Record<string, TranslationContext> = {
  AUTHENTICATION: "authentication",
  GENERAL: "general",
  ERROR_MESSAGES: "error_messages",
  NAVIGATION: "navigation",
  FORMS: "forms",
  VALIDATION: "validation",
} as const;

export const TRANSLATION_CONTEXT_LABELS = {
  [TRANSLATION_CONTEXTS.AUTHENTICATION]: "Authentication - Login, logout, auth messages",
  [TRANSLATION_CONTEXTS.GENERAL]: "General - Common UI elements",
  [TRANSLATION_CONTEXTS.ERROR_MESSAGES]: "Error Messages - Error and warning messages",
  [TRANSLATION_CONTEXTS.NAVIGATION]: "Navigation - Menu and navigation items",
  [TRANSLATION_CONTEXTS.FORMS]: "Forms - Form labels and placeholders",
  [TRANSLATION_CONTEXTS.VALIDATION]: "Validation - Form validation messages",
} as const;

// Language Codes (ISO 639-1)
export const SUPPORTED_LANGUAGES = {
  EN: "en",
  ES: "es",
  FR: "fr",
  DE: "de",
  IT: "it",
  PT: "pt",
  ZH: "zh",
  JA: "ja",
  KO: "ko",
} as const;

export const LANGUAGE_LABELS = {
  [SUPPORTED_LANGUAGES.EN]: "English",
  [SUPPORTED_LANGUAGES.ES]: "Español",
  [SUPPORTED_LANGUAGES.FR]: "Français",
  [SUPPORTED_LANGUAGES.DE]: "Deutsch",
  [SUPPORTED_LANGUAGES.IT]: "Italiano",
  [SUPPORTED_LANGUAGES.PT]: "Português",
  [SUPPORTED_LANGUAGES.ZH]: "中文",
  [SUPPORTED_LANGUAGES.JA]: "日本語",
  [SUPPORTED_LANGUAGES.KO]: "한국어",
} as const;

// CEMEX Messages
export const CEMEX_MESSAGES = {
  SUCCESS: {
    PARAMETER_SAVED: "YOUR CHANGES HAVE BEEN SAVED",
    PARAMETER_CREATED: "YOUR PARAMETER HAS BEEN SAVED",
    PARAMETER_DELETED: "YOUR PARAMETER HAS BEEN DELETED SUCCESSFULLY",
    TRANSLATION_SAVED: "YOUR CHANGES HAVE BEEN SAVED",
    TRANSLATION_CREATED: "YOUR TRANSLATION HAS BEEN SAVED",
    TRANSLATION_DELETED: "YOUR TRANSLATION HAS BEEN DELETED SUCCESSFULLY",
    APP_KEY_SAVED: "YOUR CHANGES HAVE BEEN SAVED",
    APP_KEY_CREATED: "YOUR APP KEY HAS BEEN SAVED",
    APP_KEY_DELETED: "YOUR APP KEY HAS BEEN DELETED SUCCESSFULLY",
    MAINTENANCE_WINDOW_SAVED: "YOUR CHANGES HAVE BEEN SAVED",
    MAINTENANCE_WINDOW_CREATED: "YOUR MAINTENANCE WINDOW HAS BEEN SCHEDULED",
    MAINTENANCE_WINDOW_DELETED: "YOUR MAINTENANCE WINDOW HAS BEEN DELETED SUCCESSFULLY",
    IMPORT_SUCCESS: "DATA IMPORTED SUCCESSFULLY",
    EXPORT_SUCCESS: "DATA EXPORTED SUCCESSFULLY",
  },
  ERROR: {
    DUPLICATE_PARAMETER: "The Registry already exists for this service, environment, and region combination",
    DUPLICATE_TRANSLATION: "The Translation already exists for this key, language, environment, and region combination",
    DUPLICATE_APP_KEY: "The App Key already exists for this application, key name, environment, and region combination",
    DUPLICATE_MAINTENANCE_WINDOW: "A maintenance window already exists for this time period in the specified environment",
    INVALID_FILE_FORMAT: "Invalid file format. Please upload an Excel file (.xlsx or .xls)",
    INVALID_FILE_NAME: "Invalid file name format. File name must follow CEMEX naming convention",
    FILE_TOO_LARGE: "File size exceeds the maximum limit of 10MB",
    AUTHENTICATION_REQUIRED: "Authentication required to access this resource",
    ACCESS_DENIED: "Access denied. Insufficient permissions for this operation",
    VALIDATION_FAILED: "Validation failed. Please check your input and try again",
    OPERATION_FAILED: "Operation failed. Please try again later",
  },
  WARNING: {
    PRODUCTION_ENVIRONMENT: "Production environment - changes affect live systems",
    MAINTENANCE_OVERLAP: "This maintenance window may overlap with existing maintenance",
    KEY_EXPIRATION: "This key will expire soon. Consider renewing it",
    UNSAVED_CHANGES: "You have unsaved changes. Are you sure you want to leave?",
  },
} as const;

// Message Durations (in milliseconds)
export const MESSAGE_DURATIONS = {
  SUCCESS: 5000, // 5 seconds
  ERROR: 7000,   // 7 seconds
  WARNING: 6000, // 6 seconds
  INFO: 4000,    // 4 seconds
} as const;

// File Upload Constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [".xlsx", ".xls"],
  MIME_TYPES: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
} as const;

// Excel File Naming Convention
export const EXCEL_FILE_NAMING = {
  PREFIX: "CEMEX",
  SEPARATOR: "_",
  DATE_FORMAT: "YYYY-MM-DDTHH-mm-ss",
  EXTENSION: ".xlsx",
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 1000,
  DEFAULT_OFFSET: 0,
} as const;

// Validation Constraints
export const VALIDATION_CONSTRAINTS = {
  PARAMETER_KEY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
    PATTERN: /^[A-Z0-9_]+$/,
  },
  TRANSLATION_KEY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
    PATTERN: /^[A-Z0-9_]+$/,
  },
  APP_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  KEY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
  },
  SERVICE_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  SERVICE_CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[A-Z0-9_]+$/,
  },
  MAINTENANCE_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
  },
  LANGUAGE_CODE: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 5,
    PATTERN: /^[a-z]{2}(-[A-Z]{2})?$/,
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  CEMEX: {
    AUTH: {
      LOGIN: "/api/cemex/auth/login",
      LOGOUT: "/api/cemex/auth/logout",
      STATUS: "/api/cemex/auth/status",
      VALIDATE: "/api/cemex/auth/validate",
    },
    PARAMETERS: "/api/cemex/parameters",
    TRANSLATIONS: "/api/cemex/translations",
    APP_KEYS: "/api/cemex/app-keys",
    MAINTENANCE_WINDOWS: "/api/cemex/maintenance-windows",
    AUDIT_LOGS: "/api/cemex/audit-logs",
    EXPORT: "/api/cemex/export",
    IMPORT: "/api/cemex/import",
  },
} as const;

// Route Paths
export const ROUTE_PATHS = {
  CEMEX: {
    HOME: "/cemex",
    PARAMETERS: "/cemex/parameters",
    TRANSLATIONS: "/cemex/translations",
    APPS_KEYS: "/cemex/apps-keys",
    MAINTENANCE_WINDOWS: "/cemex/maintenance-windows",
    AUDIT_LOG: "/cemex/audit-log",
    AUTH: {
      LOGIN: "/cemex/auth/login",
      LOGOUT: "/cemex/auth/logout",
    },
    ACCESS_DENIED: "/cemex/access-denied",
    ERROR: "/cemex/error",
  },
} as const;

// Cookie Names
export const COOKIE_NAMES = {
  CEMEX_AUTH_TOKEN: "cemex_auth_token",
  CEMEX_USER_INFO: "cemex_user_info",
} as const;

// Local Storage Keys
export const LOCAL_STORAGE_KEYS = {
  CEMEX_PREFERENCES: "cemex_preferences",
  CEMEX_FILTERS: "cemex_filters",
  CEMEX_DRAFT_DATA: "cemex_draft_data",
} as const;

// Environment Colors (for UI styling)
export const ENVIRONMENT_COLORS = {
  [CEMEX_ENVIRONMENTS.PROD]: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    badge: "destructive",
  },
  [CEMEX_ENVIRONMENTS.QA]: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    badge: "default",
  },
  [CEMEX_ENVIRONMENTS.DEMO]: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    badge: "secondary",
  },
  [CEMEX_ENVIRONMENTS.DEV]: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    badge: "outline",
  },
  [CEMEX_ENVIRONMENTS.DEV2]: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    badge: "outline",
  },
  [CEMEX_ENVIRONMENTS.QA2]: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    badge: "default",
  },
  [CEMEX_ENVIRONMENTS.PRE_PROD]: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    badge: "secondary",
  },
} as const;

// Role Colors (for UI styling)
export const ROLE_COLORS = {
  [CEMEX_ROLES.CONSOLE_ADMIN]: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    badge: "destructive",
  },
  [CEMEX_ROLES.TECHNICAL]: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    badge: "default",
  },
  [CEMEX_ROLES.GUEST]: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-800",
    badge: "secondary",
  },
} as const;

// Audit Log Retention (in days)
export const AUDIT_RETENTION = {
  DEFAULT: 365, // 1 year
  PRODUCTION: 2555, // 7 years for compliance
  AUTHENTICATION: 90, // 3 months
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 100,
  LOGIN_ATTEMPTS_PER_HOUR: 5,
  EXPORT_REQUESTS_PER_HOUR: 10,
  IMPORT_REQUESTS_PER_HOUR: 5,
} as const;

// Security Settings
export const SECURITY = {
  JWT_EXPIRY: "8h",
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  PASSWORD_MIN_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_IMPORT_EXPORT: true,
  ENABLE_AUDIT_LOGS: true,
  ENABLE_MAINTENANCE_WINDOWS: true,
  ENABLE_BULK_OPERATIONS: false,
  ENABLE_ADVANCED_SEARCH: true,
  ENABLE_REAL_TIME_NOTIFICATIONS: false,
} as const;

// Default Values
export const DEFAULTS = {
  PARAMETER_TYPE: PARAMETER_TYPES.STRING,
  ENVIRONMENT: CEMEX_ENVIRONMENTS.QA,
  REGION: CEMEX_REGIONS.AME,
  LANGUAGE: SUPPORTED_LANGUAGES.EN,
  MAINTENANCE_TYPE: MAINTENANCE_TYPES.SCHEDULED,
  IS_ACTIVE: true,
  NOTIFY_USERS: true,
  PAGE_SIZE: 20,
} as const;

