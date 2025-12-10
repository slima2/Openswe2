import { NextRequest } from "next/server";
import { getCemexAuthenticatedUser } from "@/lib/cemex-auth";

// Audit action types
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

// CEMEX modules for audit tracking
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

// Audit log entry interface
export interface AuditLogEntry {
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
}

// Mock audit log storage - In production, this would use Prisma
let mockAuditLogs: (AuditLogEntry & { id: string; createdAt: string })[] = [
  {
    id: "1",
    userId: "user-1",
    action: AuditAction.CREATE,
    entityType: "ConfigurationParameter",
    entityId: "param-1",
    module: CemexModule.PARAMETERS,
    tableName: "configuration_parameters",
    recordId: "param-1",
    oldValues: null,
    newValues: {
      serviceId: "service-1",
      paramKey: "MAX_LOGIN_ATTEMPTS",
      paramValue: "5",
      paramType: "INTEGER",
      environment: "PROD",
      region: "AME",
      isActive: true,
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    details: { message: "Parameter created successfully" },
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    userId: "user-1",
    action: AuditAction.UPDATE,
    entityType: "ConfigurationParameter",
    entityId: "param-1",
    module: CemexModule.PARAMETERS,
    tableName: "configuration_parameters",
    recordId: "param-1",
    oldValues: {
      paramValue: "5",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    newValues: {
      paramValue: "3",
      updatedAt: "2024-01-15T14:20:00Z",
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    details: { message: "Parameter value updated", field: "paramValue" },
    createdAt: "2024-01-15T14:20:00Z",
  },
  {
    id: "3",
    userId: "user-2",
    action: AuditAction.DELETE,
    entityType: "Translation",
    entityId: "trans-1",
    module: CemexModule.TRANSLATIONS,
    tableName: "translations",
    recordId: "trans-1",
    oldValues: {
      translationKey: "OLD_BUTTON",
      languageCode: "en",
      translationValue: "Old Button",
      context: "general",
      environment: "QA",
      isActive: true,
    },
    newValues: null,
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    details: { message: "Translation deleted", reason: "No longer needed" },
    createdAt: "2024-01-14T16:45:00Z",
  },
  {
    id: "4",
    userId: "user-1",
    action: AuditAction.EXPORT,
    entityType: "ConfigurationParameter",
    module: CemexModule.IMPORT_EXPORT,
    tableName: "configuration_parameters",
    oldValues: null,
    newValues: null,
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    details: {
      exportType: "parameters",
      environment: "PROD",
      region: "AME",
      fileName: "CEMEX_PARAMETERS_PROD_AME_2024-01-13T09-15-00.xlsx",
      recordCount: 25,
    },
    createdAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "5",
    userId: "user-1",
    action: AuditAction.LOGIN,
    entityType: "User",
    entityId: "user-1",
    module: CemexModule.AUTHENTICATION,
    tableName: "users",
    recordId: "user-1",
    oldValues: null,
    newValues: { lastLoginAt: "2024-01-15T08:00:00Z" },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    details: { message: "User logged in successfully", cemexRole: "Console Admin" },
    createdAt: "2024-01-15T08:00:00Z",
  },
];

// Audit logger class
export class AuditLogger {
  /**
   * Log an audit entry
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      // In production, this would save to database using Prisma
      const auditEntry = {
        ...entry,
        id: (mockAuditLogs.length + 1).toString(),
        createdAt: new Date().toISOString(),
      };

      mockAuditLogs.push(auditEntry);

      // Log to console for development
      console.log("Audit Log Entry:", {
        action: entry.action,
        module: entry.module,
        entityType: entry.entityType,
        userId: entry.userId,
        timestamp: auditEntry.createdAt,
      });

    } catch (error) {
      console.error("Failed to log audit entry:", error);
      // In production, this might trigger an alert or fallback logging mechanism
    }
  }

  /**
   * Log CRUD operation with before/after values
   */
  static async logCRUD(
    action: AuditAction,
    module: CemexModule,
    entityType: string,
    entityId: string,
    userId: string,
    oldValues?: any,
    newValues?: any,
    request?: NextRequest,
    additionalDetails?: any
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      action,
      entityType,
      entityId,
      module,
      tableName: this.getTableName(entityType),
      recordId: entityId,
      oldValues,
      newValues,
      ipAddress: this.extractIpAddress(request),
      userAgent: this.extractUserAgent(request),
      details: {
        ...additionalDetails,
        timestamp: new Date().toISOString(),
      },
    };

    await this.log(entry);
  }

  /**
   * Log authentication events
   */
  static async logAuth(
    action: AuditAction,
    userId: string,
    request?: NextRequest,
    details?: any
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      action,
      entityType: "User",
      entityId: userId,
      module: CemexModule.AUTHENTICATION,
      tableName: "users",
      recordId: userId,
      ipAddress: this.extractIpAddress(request),
      userAgent: this.extractUserAgent(request),
      details,
    };

    await this.log(entry);
  }

  /**
   * Log import/export operations
   */
  static async logImportExport(
    action: AuditAction.IMPORT | AuditAction.EXPORT,
    module: CemexModule,
    userId: string,
    request?: NextRequest,
    details?: any
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      action,
      entityType: "ImportExport",
      module: CemexModule.IMPORT_EXPORT,
      ipAddress: this.extractIpAddress(request),
      userAgent: this.extractUserAgent(request),
      details: {
        ...details,
        targetModule: module,
        timestamp: new Date().toISOString(),
      },
    };

    await this.log(entry);
  }

  /**
   * Log access denied events
   */
  static async logAccessDenied(
    userId: string,
    resource: string,
    requiredRole: string,
    userRole: string,
    request?: NextRequest
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      action: AuditAction.ACCESS_DENIED,
      entityType: "AccessControl",
      module: CemexModule.AUTHENTICATION,
      ipAddress: this.extractIpAddress(request),
      userAgent: this.extractUserAgent(request),
      details: {
        resource,
        requiredRole,
        userRole,
        timestamp: new Date().toISOString(),
      },
    };

    await this.log(entry);
  }

  /**
   * Retrieve audit logs with filtering
   */
  static async getAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    module?: CemexModule;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    logs: any[];
    total: number;
    limit: number;
    offset: number;
  }> {
    let filteredLogs = [...mockAuditLogs];

    // Apply filters
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters.module) {
      filteredLogs = filteredLogs.filter(log => log.module === filters.module);
    }

    if (filters.entityType) {
      filteredLogs = filteredLogs.filter(log => log.entityType === filters.entityType);
    }

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.createdAt) >= new Date(filters.startDate!)
      );
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.createdAt) <= new Date(filters.endDate!)
      );
    }

    // Sort by creation date (newest first)
    filteredLogs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total: filteredLogs.length,
      limit,
      offset,
    };
  }

  /**
   * Get table name from entity type
   */
  private static getTableName(entityType: string): string {
    const tableMap: Record<string, string> = {
      ConfigurationParameter: "configuration_parameters",
      Translation: "translations",
      AppKey: "app_keys",
      MaintenanceWindow: "maintenance_windows",
      Service: "services",
      User: "users",
      Language: "languages",
    };

    return tableMap[entityType] || entityType.toLowerCase();
  }

  /**
   * Extract IP address from request
   */
  private static extractIpAddress(request?: NextRequest): string | undefined {
    if (!request) return undefined;

    // Check various headers for IP address
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const remoteAddr = request.headers.get("remote-addr");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    return realIp || remoteAddr || undefined;
  }

  /**
   * Extract user agent from request
   */
  private static extractUserAgent(request?: NextRequest): string | undefined {
    if (!request) return undefined;
    return request.headers.get("user-agent") || undefined;
  }
}

// Audit middleware decorator for API routes
export function withAudit(
  action: AuditAction,
  module: CemexModule,
  entityType: string
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[0] as NextRequest;
      let result;
      let error;

      try {
        // Execute the original method
        result = await method.apply(this, args);
        
        // Log successful operation
        const user = await getCemexAuthenticatedUser(request);
        if (user) {
          await AuditLogger.logCRUD(
            action,
            module,
            entityType,
            "unknown", // Entity ID would be extracted from result
            user.id,
            undefined, // Old values would be captured before operation
            undefined, // New values would be captured from result
            request,
            { success: true }
          );
        }

        return result;
      } catch (err) {
        error = err;
        
        // Log failed operation
        const user = await getCemexAuthenticatedUser(request);
        if (user) {
          await AuditLogger.logCRUD(
            action,
            module,
            entityType,
            "unknown",
            user.id,
            undefined,
            undefined,
            request,
            { 
              success: false, 
              error: err instanceof Error ? err.message : "Unknown error" 
            }
          );
        }

        throw error;
      }
    };

    return descriptor;
  };
}

// Helper function to create audit middleware for specific operations
export function createAuditMiddleware(
  module: CemexModule,
  entityType: string
) {
  return {
    async logCreate(
      userId: string,
      entityId: string,
      newValues: any,
      request?: NextRequest,
      details?: any
    ) {
      await AuditLogger.logCRUD(
        AuditAction.CREATE,
        module,
        entityType,
        entityId,
        userId,
        null,
        newValues,
        request,
        details
      );
    },

    async logUpdate(
      userId: string,
      entityId: string,
      oldValues: any,
      newValues: any,
      request?: NextRequest,
      details?: any
    ) {
      await AuditLogger.logCRUD(
        AuditAction.UPDATE,
        module,
        entityType,
        entityId,
        userId,
        oldValues,
        newValues,
        request,
        details
      );
    },

    async logDelete(
      userId: string,
      entityId: string,
      oldValues: any,
      request?: NextRequest,
      details?: any
    ) {
      await AuditLogger.logCRUD(
        AuditAction.DELETE,
        module,
        entityType,
        entityId,
        userId,
        oldValues,
        null,
        request,
        details
      );
    },

    async logRead(
      userId: string,
      entityId: string,
      request?: NextRequest,
      details?: any
    ) {
      await AuditLogger.logCRUD(
        AuditAction.READ,
        module,
        entityType,
        entityId,
        userId,
        undefined,
        undefined,
        request,
        details
      );
    },
  };
}
