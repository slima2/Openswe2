/**
 * CEMEX Configuration Console - Shared Types
 * Common type definitions used across frontend and backend components
 */

// CEMEX User and Authentication Types
export interface CemexUser {
  id: string;
  cemexId: string;
  username: string;
  email: string;
  name: string;
  region: CemexRegion;
  cemexRole: CemexRole;
  department: string;
  environment: CemexEnvironment;
}

export interface CemexJWTPayload extends CemexUser {
  iat?: number;
  exp?: number;
}

export type CemexRole = "Console Admin" | "Technical" | "Guest";
export type CemexRegion = "AME" | "EUR";
export type CemexEnvironment = "QA" | "PROD" | "DEMO" | "DEV" | "DEV2" | "QA2" | "PRE-PROD";

// CEMEX Module Types
export enum CemexModule {
  PARAMETERS = "PARAMETERS",
  TRANSLATIONS = "TRANSLATIONS",
  APP_KEYS = "APP_KEYS",
  MAINTENANCE_WINDOWS = "MAINTENANCE_WINDOWS",
  SERVICES = "SERVICES",
  USERS = "USERS",
  AUDIT_LOGS = "AUDIT_LOGS",
  AUTHENTICATION = "AUTHENTICATION",
  IMPORT_EXPORT = "IMPORT_EXPORT",
}

// Configuration Parameter Types
export interface ConfigurationParameter {
  id: string;
  serviceId: string;
  serviceName?: string;
  paramKey: string;
  paramValue?: string;
  paramType: ParameterType;
  environment: CemexEnvironment;
  region?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ParameterType = "STRING" | "INTEGER" | "DECIMAL" | "BOOLEAN" | "JSON";

export interface Service {
  id: string;
  serviceName: string;
  serviceCode: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Translation Types
export interface Translation {
  id: string;
  translationKey: string;
  languageCode: string;
  translationValue: string;
  context?: string;
  environment: CemexEnvironment;
  region?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Language {
  id: string;
  languageCode: string;
  languageName: string;
  isActive: boolean;
  createdAt: string;
}

export type TranslationContext = "authentication" | "general" | "error_messages" | "navigation" | "forms" | "validation";

// App Key Types
export interface AppKey {
  id: string;
  appName: string;
  keyName: string;
  keyValue?: string;
  environment: CemexEnvironment;
  region?: string;
  expiresAt?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AppKeyType = "JWT_SECRET" | "ENCRYPTION_KEY" | "API_KEY" | "DATABASE_KEY" | "PUSH_NOTIFICATION_KEY" | "OAUTH_SECRET";

// Maintenance Window Types
export interface MaintenanceWindow {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  environment: CemexEnvironment;
  region?: string;
  affectedServices?: string[];
  maintenanceType: MaintenanceType;
  isActive: boolean;
  notifyUsers: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceType = "SCHEDULED" | "EMERGENCY" | "HOTFIX" | "UPGRADE";

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: any;
  module?: CemexModule;
  tableName?: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export enum AuditAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  ACCESS_DENIED = "ACCESS_DENIED",
}

// API Response Types
export interface CemexApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface CemexPaginatedResponse<T = any> extends CemexApiResponse<T> {
  total: number;
  limit: number;
  offset: number;
  page?: number;
  totalPages?: number;
}

// Import/Export Types
export interface ImportResult {
  totalRows: number;
  successfulImports: number;
  skippedRows: number;
  errors: string[];
  warnings: string[];
}

export interface ExportOptions {
  type: "parameters" | "translations" | "appkeys" | "maintenance-windows";
  environment?: CemexEnvironment;
  region?: CemexRegion;
  serviceId?: string;
  format?: "xlsx" | "csv";
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

// Permission Types
export interface CemexPermissions {
  hasReadAccess: boolean;
  canPerformCRUD: boolean;
  hasImportExportAccess: boolean;
  isConsoleAdmin: boolean;
  isTechnical: boolean;
  isGuest: boolean;
}

// Filter Types
export interface ParameterFilters {
  search?: string;
  serviceId?: string;
  environment?: CemexEnvironment;
  region?: string;
  paramType?: ParameterType;
  isActive?: boolean;
}

export interface TranslationFilters {
  search?: string;
  languageCode?: string;
  context?: string;
  environment?: CemexEnvironment;
  region?: string;
  isActive?: boolean;
}

export interface AppKeyFilters {
  search?: string;
  appName?: string;
  environment?: CemexEnvironment;
  region?: string;
  isActive?: boolean;
}

export interface MaintenanceWindowFilters {
  search?: string;
  environment?: CemexEnvironment;
  region?: string;
  maintenanceType?: MaintenanceType;
  isActive?: boolean;
  upcoming?: boolean;
}

export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  module?: CemexModule;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

// Form Data Types
export interface ParameterFormData {
  serviceId: string;
  paramKey: string;
  paramValue?: string;
  paramType: ParameterType;
  environment: CemexEnvironment;
  region?: string;
  isActive: boolean;
}

export interface TranslationFormData {
  translationKey: string;
  languageCode: string;
  translationValue: string;
  context?: string;
  environment: CemexEnvironment;
  region?: string;
  isActive: boolean;
}

export interface AppKeyFormData {
  appName: string;
  keyName: string;
  keyValue?: string;
  environment: CemexEnvironment;
  region?: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface MaintenanceWindowFormData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  environment: CemexEnvironment;
  region?: string;
  affectedServices?: string[];
  maintenanceType: MaintenanceType;
  isActive: boolean;
  notifyUsers: boolean;
}

// Message Types
export interface CemexMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  text: string;
  duration?: number;
  actions?: CemexMessageAction[];
  timestamp: number;
}

export interface CemexMessageAction {
  label: string;
  action: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

// Environment Hierarchy Types
export interface EnvironmentHierarchy {
  [key: string]: number;
}

export const ENVIRONMENT_HIERARCHY: EnvironmentHierarchy = {
  QA: 1,
  PROD: 2,
  DEMO: 3,
  DEV: 3,
  DEV2: 3,
  QA2: 3,
  "PRE-PROD": 3,
} as const;

// File Naming Convention Types
export interface ExcelFileNameParts {
  prefix: string;
  module: string;
  environment: CemexEnvironment;
  region?: string;
  service?: string;
  timestamp: string;
  extension: string;
}

// Error Types
export class CemexError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
    public statusCode?: number
  ) {
    super(message);
    this.name = "CemexError";
  }
}

export class CemexValidationError extends CemexError {
  constructor(
    message: string,
    public validationErrors: ValidationError[],
    details?: any
  ) {
    super(message, "VALIDATION_ERROR", details, 400);
    this.name = "CemexValidationError";
  }
}

export class CemexAuthenticationError extends CemexError {
  constructor(message: string, details?: any) {
    super(message, "AUTHENTICATION_ERROR", details, 401);
    this.name = "CemexAuthenticationError";
  }
}

export class CemexAuthorizationError extends CemexError {
  constructor(message: string, public requiredRole?: string, public userRole?: string) {
    super(message, "AUTHORIZATION_ERROR", { requiredRole, userRole }, 403);
    this.name = "CemexAuthorizationError";
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event Types
export interface CemexEvent<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  userId?: string;
  module?: CemexModule;
}

export interface CemexEventHandler<T = any> {
  (event: CemexEvent<T>): void | Promise<void>;
}
