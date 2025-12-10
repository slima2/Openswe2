/**
 * CEMEX Configuration Console - Shared Business Logic Utilities
 * Common business logic functions used across frontend and backend components
 */

import {
  CemexUser,
  CemexRole,
  CemexEnvironment,
  CemexRegion,
  ParameterType,
  MaintenanceType,
  ConfigurationParameter,
  Translation,
  AppKey,
  MaintenanceWindow,
  ExcelFileNameParts,
  CemexPermissions,
} from "./types";
import {
  CEMEX_ROLES,
  CEMEX_ROLE_HIERARCHY,
  ENVIRONMENT_HIERARCHY,
  EXCEL_FILE_NAMING,
  MESSAGE_DURATIONS,
  PARAMETER_TYPES,
  CEMEX_MESSAGES,
} from "./constants";

// Permission utility functions
export function hasRole(user: CemexUser | null, requiredRoles: CemexRole[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.cemexRole);
}

export function canPerformImportExport(userRole: CemexRole): boolean {
  return userRole === CEMEX_ROLES.CONSOLE_ADMIN;
}

export function canPerformCRUD(userRole: CemexRole): boolean {
  return userRole === CEMEX_ROLES.CONSOLE_ADMIN || userRole === CEMEX_ROLES.TECHNICAL;
}

export function hasReadAccess(userRole: CemexRole): boolean {
  return Object.values(CEMEX_ROLES).includes(userRole);
}

export function getUserPermissions(user: CemexUser | null): CemexPermissions {
  if (!user) {
    return {
      hasReadAccess: false,
      canPerformCRUD: false,
      hasImportExportAccess: false,
      isConsoleAdmin: false,
      isTechnical: false,
      isGuest: false,
    };
  }

  return {
    hasReadAccess: hasReadAccess(user.cemexRole),
    canPerformCRUD: canPerformCRUD(user.cemexRole),
    hasImportExportAccess: canPerformImportExport(user.cemexRole),
    isConsoleAdmin: user.cemexRole === CEMEX_ROLES.CONSOLE_ADMIN,
    isTechnical: user.cemexRole === CEMEX_ROLES.TECHNICAL,
    isGuest: user.cemexRole === CEMEX_ROLES.GUEST,
  };
}

export function getRoleHierarchyLevel(role: CemexRole): number {
  return CEMEX_ROLE_HIERARCHY[role] || 0;
}

export function hasHigherOrEqualRole(userRole: CemexRole, requiredRole: CemexRole): boolean {
  return getRoleHierarchyLevel(userRole) >= getRoleHierarchyLevel(requiredRole);
}

// Environment utility functions
export function getEnvironmentHierarchyLevel(environment: CemexEnvironment): number {
  return ENVIRONMENT_HIERARCHY[environment] || 999;
}

export function canImportToEnvironment(
  sourceEnvironment: CemexEnvironment,
  targetEnvironment: CemexEnvironment
): boolean {
  const sourceLevel = getEnvironmentHierarchyLevel(sourceEnvironment);
  const targetLevel = getEnvironmentHierarchyLevel(targetEnvironment);
  return sourceLevel <= targetLevel;
}

export function isProductionEnvironment(environment: CemexEnvironment): boolean {
  return environment === "PROD";
}

export function getEnvironmentRiskLevel(environment: CemexEnvironment): "low" | "medium" | "high" {
  switch (environment) {
    case "PROD":
      return "high";
    case "PRE-PROD":
    case "QA":
      return "medium";
    default:
      return "low";
  }
}

// Parameter utility functions
export function formatParameterValue(value: string | undefined, type: ParameterType): string {
  if (!value) return "";

  switch (type) {
    case PARAMETER_TYPES.BOOLEAN:
      return value.toLowerCase() === "true" ? "Yes" : "No";
    case PARAMETER_TYPES.JSON:
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

export function validateParameterValueFormat(value: string, type: ParameterType): boolean {
  if (!value) return true; // Optional field

  switch (type) {
    case PARAMETER_TYPES.INTEGER:
      return /^-?\d+$/.test(value);
    case PARAMETER_TYPES.DECIMAL:
      return /^-?\d+(\.\d+)?$/.test(value);
    case PARAMETER_TYPES.BOOLEAN:
      return /^(true|false)$/i.test(value);
    case PARAMETER_TYPES.JSON:
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    default:
      return true;
  }
}

export function getParameterTypeIcon(type: ParameterType): string {
  switch (type) {
    case PARAMETER_TYPES.STRING:
      return "📝";
    case PARAMETER_TYPES.INTEGER:
      return "🔢";
    case PARAMETER_TYPES.DECIMAL:
      return "💯";
    case PARAMETER_TYPES.BOOLEAN:
      return "✅";
    case PARAMETER_TYPES.JSON:
      return "📋";
    default:
      return "❓";
  }
}

// Key masking utility functions
export function maskKeyValue(keyValue: string, visibleChars: number = 4): string {
  if (!keyValue || keyValue.length <= visibleChars * 2) {
    return "••••••••";
  }

  const start = keyValue.substring(0, visibleChars);
  const end = keyValue.substring(keyValue.length - visibleChars);
  const middle = "•".repeat(Math.min(keyValue.length - visibleChars * 2, 20));

  return `${start}${middle}${end}`;
}

export function shouldMaskKeyValue(userRole: CemexRole): boolean {
  return userRole !== CEMEX_ROLES.CONSOLE_ADMIN;
}

// Date and time utility functions
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  } catch {
    return dateString;
  }
}

export function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return dateString;
  }
}

export function isExpiringSoon(expirationDate: string, daysThreshold: number = 30): boolean {
  try {
    const expiry = new Date(expirationDate);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays <= daysThreshold && diffDays >= 0;
  } catch {
    return false;
  }
}

export function isExpired(expirationDate: string): boolean {
  try {
    const expiry = new Date(expirationDate);
    const now = new Date();
    return expiry <= now;
  } catch {
    return false;
  }
}

// Maintenance window utility functions
export function getMaintenanceStatus(maintenanceWindow: MaintenanceWindow): "upcoming" | "active" | "completed" {
  const now = new Date();
  const start = new Date(maintenanceWindow.startTime);
  const end = new Date(maintenanceWindow.endTime);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  return "completed";
}

export function getMaintenanceDuration(startTime: string, endTime: string): string {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours === 0) return `${diffMinutes} minutes`;
    if (diffMinutes === 0) return `${diffHours} hours`;
    return `${diffHours}h ${diffMinutes}m`;
  } catch {
    return "Unknown";
  }
}

export function getMaintenanceTypeColor(type: MaintenanceType): string {
  switch (type) {
    case "EMERGENCY":
      return "red";
    case "HOTFIX":
      return "orange";
    case "UPGRADE":
      return "blue";
    case "SCHEDULED":
    default:
      return "green";
  }
}

// File naming utility functions
export function generateExcelFileName(
  module: string,
  environment: CemexEnvironment,
  region?: CemexRegion,
  service?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const parts = [
    EXCEL_FILE_NAMING.PREFIX,
    module.toUpperCase(),
    environment,
  ];

  if (region) parts.push(region);
  if (service) parts.push(service);
  parts.push(timestamp);

  return parts.join(EXCEL_FILE_NAMING.SEPARATOR) + EXCEL_FILE_NAMING.EXTENSION;
}

export function parseExcelFileName(fileName: string): ExcelFileNameParts | null {
  try {
    const nameWithoutExt = fileName.replace(/\.(xlsx|xls)$/, "");
    const parts = nameWithoutExt.split(EXCEL_FILE_NAMING.SEPARATOR);

    if (parts.length < 4 || parts[0] !== EXCEL_FILE_NAMING.PREFIX) {
      return null;
    }

    return {
      prefix: parts[0],
      module: parts[1],
      environment: parts[2] as CemexEnvironment,
      region: parts.length > 4 ? (parts[3] as CemexRegion) : undefined,
      service: parts.length > 5 ? parts[4] : undefined,
      timestamp: parts[parts.length - 1],
      extension: fileName.includes(".xlsx") ? ".xlsx" : ".xls",
    };
  } catch {
    return null;
  }
}

// Message utility functions
export function getMessageDuration(type: "success" | "error" | "warning" | "info"): number {
  switch (type) {
    case "success":
      return MESSAGE_DURATIONS.SUCCESS;
    case "error":
      return MESSAGE_DURATIONS.ERROR;
    case "warning":
      return MESSAGE_DURATIONS.WARNING;
    case "info":
    default:
      return MESSAGE_DURATIONS.INFO;
  }
}

export function getCemexMessage(key: keyof typeof CEMEX_MESSAGES.SUCCESS | keyof typeof CEMEX_MESSAGES.ERROR | keyof typeof CEMEX_MESSAGES.WARNING): string {
  // Try success messages first
  if (key in CEMEX_MESSAGES.SUCCESS) {
    return CEMEX_MESSAGES.SUCCESS[key as keyof typeof CEMEX_MESSAGES.SUCCESS];
  }
  
  // Try error messages
  if (key in CEMEX_MESSAGES.ERROR) {
    return CEMEX_MESSAGES.ERROR[key as keyof typeof CEMEX_MESSAGES.ERROR];
  }
  
  // Try warning messages
  if (key in CEMEX_MESSAGES.WARNING) {
    return CEMEX_MESSAGES.WARNING[key as keyof typeof CEMEX_MESSAGES.WARNING];
  }
  
  return "Operation completed";
}

// Search and filter utility functions
export function filterParameters(
  parameters: ConfigurationParameter[],
  filters: {
    search?: string;
    serviceId?: string;
    environment?: CemexEnvironment;
    region?: string;
    paramType?: ParameterType;
    isActive?: boolean;
  }
): ConfigurationParameter[] {
  return parameters.filter((param) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        param.paramKey.toLowerCase().includes(searchLower) ||
        param.paramValue?.toLowerCase().includes(searchLower) ||
        param.serviceName?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.serviceId && param.serviceId !== filters.serviceId) return false;
    if (filters.environment && param.environment !== filters.environment) return false;
    if (filters.region && param.region !== filters.region) return false;
    if (filters.paramType && param.paramType !== filters.paramType) return false;
    if (filters.isActive !== undefined && param.isActive !== filters.isActive) return false;

    return true;
  });
}

export function filterTranslations(
  translations: Translation[],
  filters: {
    search?: string;
    languageCode?: string;
    context?: string;
    environment?: CemexEnvironment;
    region?: string;
    isActive?: boolean;
  }
): Translation[] {
  return translations.filter((translation) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        translation.translationKey.toLowerCase().includes(searchLower) ||
        translation.translationValue.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.languageCode && translation.languageCode !== filters.languageCode) return false;
    if (filters.context && translation.context !== filters.context) return false;
    if (filters.environment && translation.environment !== filters.environment) return false;
    if (filters.region && translation.region !== filters.region) return false;
    if (filters.isActive !== undefined && translation.isActive !== filters.isActive) return false;

    return true;
  });
}

export function filterAppKeys(
  appKeys: AppKey[],
  filters: {
    search?: string;
    appName?: string;
    environment?: CemexEnvironment;
    region?: string;
    isActive?: boolean;
  }
): AppKey[] {
  return appKeys.filter((appKey) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        appKey.appName.toLowerCase().includes(searchLower) ||
        appKey.keyName.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.appName && appKey.appName !== filters.appName) return false;
    if (filters.environment && appKey.environment !== filters.environment) return false;
    if (filters.region && appKey.region !== filters.region) return false;
    if (filters.isActive !== undefined && appKey.isActive !== filters.isActive) return false;

    return true;
  });
}

export function filterMaintenanceWindows(
  windows: MaintenanceWindow[],
  filters: {
    search?: string;
    environment?: CemexEnvironment;
    region?: string;
    maintenanceType?: MaintenanceType;
    isActive?: boolean;
    upcoming?: boolean;
  }
): MaintenanceWindow[] {
  return windows.filter((window) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        window.title.toLowerCase().includes(searchLower) ||
        window.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.environment && window.environment !== filters.environment) return false;
    if (filters.region && window.region !== filters.region) return false;
    if (filters.maintenanceType && window.maintenanceType !== filters.maintenanceType) return false;
    if (filters.isActive !== undefined && window.isActive !== filters.isActive) return false;

    if (filters.upcoming) {
      const now = new Date();
      const startTime = new Date(window.startTime);
      if (startTime <= now) return false;
    }

    return true;
  });
}

// Sorting utility functions
export function sortByDate<T extends { createdAt: string }>(items: T[], direction: "asc" | "desc" = "desc"): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return direction === "desc" ? dateB - dateA : dateA - dateB;
  });
}

export function sortByName<T extends { [K in keyof T]: string }>(
  items: T[],
  field: keyof T,
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...items].sort((a, b) => {
    const valueA = String(a[field]).toLowerCase();
    const valueB = String(b[field]).toLowerCase();
    const comparison = valueA.localeCompare(valueB);
    return direction === "desc" ? -comparison : comparison;
  });
}

// Pagination utility functions
export function paginateItems<T>(items: T[], page: number, limit: number): {
  items: T[];
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);
  const totalPages = Math.ceil(items.length / limit);

  return {
    items: paginatedItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// Utility function to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Utility function to deep clone objects
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === "object") {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

// Utility function to debounce function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Utility function to throttle function calls
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
