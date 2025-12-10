import { NextRequest, NextResponse } from "next/server";
import { getCemexAuthenticatedUser, hasCemexRole, canPerformImportExport, canPerformCRUD, hasReadAccess } from "@/lib/cemex-auth";
import { AuditLogger, AuditAction, CemexModule } from "@/lib/audit-logger";

export type CemexRole = "Console Admin" | "Technical" | "Guest";

export interface CemexMiddlewareOptions {
  requiredRoles?: CemexRole[];
  requireImportExport?: boolean;
  requireCRUD?: boolean;
  requireRead?: boolean;
  allowUnauthenticated?: boolean;
  redirectTo?: string;
}

/**
 * CEMEX role-based access control middleware
 * Validates user authentication and permissions for CEMEX console routes
 */
export async function cemexAuthMiddleware(
  request: NextRequest,
  options: CemexMiddlewareOptions = {}
): Promise<NextResponse | null> {
  const {
    requiredRoles,
    requireImportExport = false,
    requireCRUD = false,
    requireRead = false,
    allowUnauthenticated = false,
    redirectTo = "/cemex/auth/login",
  } = options;

  try {
    // Get authenticated user
    const user = getCemexAuthenticatedUser(request);

    // If user is not authenticated
    if (!user) {
      if (allowUnauthenticated) {
        return null; // Allow request to continue
      }

      // Log unauthorized access attempt
      await AuditLogger.log({
        userId: "anonymous",
        action: AuditAction.ACCESS_DENIED,
        entityType: "Route",
        module: CemexModule.AUTHENTICATION,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        details: {
          message: "Unauthenticated access attempt",
          requestedPath: request.nextUrl.pathname,
          timestamp: new Date().toISOString(),
        },
      });

      // Redirect to login or return 401 for API routes
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // Check role-based permissions
    let hasPermission = true;
    let denialReason = "";

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => hasCemexRole(user, [role]));
      if (!hasRequiredRole) {
        hasPermission = false;
        denialReason = `Required roles: ${requiredRoles.join(", ")}. User role: ${user.cemexRole}`;
      }
    }

    if (hasPermission && requireImportExport && !canPerformImportExport(user.cemexRole)) {
      hasPermission = false;
      denialReason = `Import/Export access required. User role: ${user.cemexRole}`;
    }

    if (hasPermission && requireCRUD && !canPerformCRUD(user.cemexRole)) {
      hasPermission = false;
      denialReason = `CRUD access required. User role: ${user.cemexRole}`;
    }

    if (hasPermission && requireRead && !hasReadAccess(user.cemexRole)) {
      hasPermission = false;
      denialReason = `Read access required. User role: ${user.cemexRole}`;
    }

    // If user doesn't have required permissions
    if (!hasPermission) {
      // Log access denied
      await AuditLogger.logAccessDenied(
        user.id,
        request.nextUrl.pathname,
        requiredRoles?.join(", ") || "Unknown",
        user.cemexRole,
        request
      );

      // Return 403 for API routes or redirect for pages
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { 
            error: "Access denied", 
            message: denialReason,
            userRole: user.cemexRole 
          },
          { status: 403 }
        );
      }

      // Redirect to access denied page
      return NextResponse.redirect(new URL("/cemex/access-denied", request.url));
    }

    // Allow request to continue
    return null;

  } catch (error) {
    console.error("CEMEX auth middleware error:", error);

    // Log middleware error
    await AuditLogger.log({
      userId: "system",
      action: AuditAction.ACCESS_DENIED,
      entityType: "Middleware",
      module: CemexModule.AUTHENTICATION,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      details: {
        message: "CEMEX auth middleware error",
        error: error instanceof Error ? error.message : "Unknown error",
        requestedPath: request.nextUrl.pathname,
      },
    });

    // Return 500 for API routes or redirect for pages
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication service error" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL("/cemex/error", request.url));
  }
}

/**
 * Middleware factory for different permission levels
 */
export const cemexMiddleware = {
  /**
   * Console Admin only access
   */
  consoleAdminOnly: (request: NextRequest) =>
    cemexAuthMiddleware(request, {
      requiredRoles: ["Console Admin"],
    }),

  /**
   * Console Admin and Technical access (CRUD operations)
   */
  crudAccess: (request: NextRequest) =>
    cemexAuthMiddleware(request, {
      requireCRUD: true,
    }),

  /**
   * Import/Export access (Console Admin only)
   */
  importExportAccess: (request: NextRequest) =>
    cemexAuthMiddleware(request, {
      requireImportExport: true,
    }),

  /**
   * Read-only access (all authenticated users)
   */
  readAccess: (request: NextRequest) =>
    cemexAuthMiddleware(request, {
      requireRead: true,
    }),

  /**
   * Any authenticated CEMEX user
   */
  authenticated: (request: NextRequest) =>
    cemexAuthMiddleware(request, {}),

  /**
   * Custom role-based access
   */
  roleBasedAccess: (roles: CemexRole[]) => (request: NextRequest) =>
    cemexAuthMiddleware(request, {
      requiredRoles: roles,
    }),
};

/**
 * Utility functions for use in API routes
 */
export async function requireCemexAuth(request: NextRequest): Promise<{ user: any; response?: NextResponse }> {
  const user = getCemexAuthenticatedUser(request);
  
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return { user };
}

export async function requireCemexRole(
  request: NextRequest,
  requiredRoles: CemexRole[]
): Promise<{ user: any; response?: NextResponse }> {
  const { user, response } = await requireCemexAuth(request);
  
  if (response) {
    return { user, response };
  }

  const hasRequiredRole = requiredRoles.some(role => hasCemexRole(user, [role]));
  
  if (!hasRequiredRole) {
    await AuditLogger.logAccessDenied(
      user.id,
      request.nextUrl.pathname,
      requiredRoles.join(", "),
      user.cemexRole,
      request
    );

    return {
      user,
      response: NextResponse.json(
        { 
          error: "Access denied", 
          message: `Required roles: ${requiredRoles.join(", ")}. Your role: ${user.cemexRole}` 
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export async function requireCemexCRUD(request: NextRequest): Promise<{ user: any; response?: NextResponse }> {
  const { user, response } = await requireCemexAuth(request);
  
  if (response) {
    return { user, response };
  }

  if (!canPerformCRUD(user.cemexRole)) {
    await AuditLogger.logAccessDenied(
      user.id,
      request.nextUrl.pathname,
      "CRUD operations",
      user.cemexRole,
      request
    );

    return {
      user,
      response: NextResponse.json(
        { 
          error: "Access denied", 
          message: "CRUD operations require Console Admin or Technical role" 
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export async function requireCemexImportExport(request: NextRequest): Promise<{ user: any; response?: NextResponse }> {
  const { user, response } = await requireCemexAuth(request);
  
  if (response) {
    return { user, response };
  }

  if (!canPerformImportExport(user.cemexRole)) {
    await AuditLogger.logAccessDenied(
      user.id,
      request.nextUrl.pathname,
      "Import/Export operations",
      user.cemexRole,
      request
    );

    return {
      user,
      response: NextResponse.json(
        { 
          error: "Access denied", 
          message: "Import/Export operations require Console Admin role" 
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}
