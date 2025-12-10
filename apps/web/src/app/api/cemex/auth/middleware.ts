import { NextRequest, NextResponse } from "next/server";
import { 
  getCemexAuthenticatedUser, 
  hasCemexRole, 
  canPerformImportExport, 
  canPerformCRUD, 
  hasReadAccess,
  CemexRole,
  CemexUser 
} from "@/lib/cemex-auth";

export interface CemexAuthRequest extends NextRequest {
  cemexUser?: CemexUser;
}

/**
 * CEMEX authentication middleware
 * Validates CEMEX authentication token and attaches user to request
 */
export function cemexAuthMiddleware() {
  return async (request: CemexAuthRequest): Promise<NextResponse | null> => {
    try {
      const user = getCemexAuthenticatedUser(request);

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "CEMEX authentication required",
            code: "AUTH_REQUIRED",
          },
          { status: 401 }
        );
      }

      // Attach user to request for downstream handlers
      request.cemexUser = user;
      return null; // Continue to next handler

    } catch (error) {
      console.error("CEMEX auth middleware error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Authentication validation failed",
          code: "AUTH_ERROR",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * CEMEX role authorization middleware
 * Validates user has required CEMEX roles
 */
export function cemexRoleMiddleware(requiredRoles: CemexRole[]) {
  return async (request: CemexAuthRequest): Promise<NextResponse | null> => {
    try {
      const user = request.cemexUser || getCemexAuthenticatedUser(request);

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "CEMEX authentication required",
            code: "AUTH_REQUIRED",
          },
          { status: 401 }
        );
      }

      if (!hasCemexRole(user, requiredRoles)) {
        return NextResponse.json(
          {
            success: false,
            error: `Access denied. Required roles: ${requiredRoles.join(", ")}`,
            code: "INSUFFICIENT_PERMISSIONS",
            userRole: user.cemexRole,
            requiredRoles,
          },
          { status: 403 }
        );
      }

      return null; // Continue to next handler

    } catch (error) {
      console.error("CEMEX role middleware error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Role validation failed",
          code: "ROLE_ERROR",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * CEMEX Console Admin only middleware
 * Restricts access to Console Admin role only
 */
export function cemexAdminOnlyMiddleware() {
  return cemexRoleMiddleware(["Console Admin"]);
}

/**
 * CEMEX CRUD operations middleware
 * Allows Console Admin and Technical roles
 */
export function cemexCRUDMiddleware() {
  return cemexRoleMiddleware(["Console Admin", "Technical"]);
}

/**
 * CEMEX read access middleware
 * Allows all CEMEX roles (Console Admin, Technical, Guest)
 */
export function cemexReadAccessMiddleware() {
  return cemexRoleMiddleware(["Console Admin", "Technical", "Guest"]);
}

/**
 * CEMEX import/export middleware
 * Restricts import/export operations to Console Admin only
 */
export function cemexImportExportMiddleware() {
  return async (request: CemexAuthRequest): Promise<NextResponse | null> => {
    try {
      const user = request.cemexUser || getCemexAuthenticatedUser(request);

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "CEMEX authentication required",
            code: "AUTH_REQUIRED",
          },
          { status: 401 }
        );
      }

      if (!canPerformImportExport(user)) {
        return NextResponse.json(
          {
            success: false,
            error: "Import/Export operations restricted to Console Admin only",
            code: "IMPORT_EXPORT_RESTRICTED",
            userRole: user.cemexRole,
          },
          { status: 403 }
        );
      }

      return null; // Continue to next handler

    } catch (error) {
      console.error("CEMEX import/export middleware error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Import/Export validation failed",
          code: "IMPORT_EXPORT_ERROR",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * CEMEX region validation middleware
 * Validates user access to specific region
 */
export function cemexRegionMiddleware(allowedRegions: string[]) {
  return async (request: CemexAuthRequest): Promise<NextResponse | null> => {
    try {
      const user = request.cemexUser || getCemexAuthenticatedUser(request);

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "CEMEX authentication required",
            code: "AUTH_REQUIRED",
          },
          { status: 401 }
        );
      }

      if (!allowedRegions.includes(user.region)) {
        return NextResponse.json(
          {
            success: false,
            error: `Access denied for region: ${user.region}. Allowed regions: ${allowedRegions.join(", ")}`,
            code: "REGION_ACCESS_DENIED",
            userRegion: user.region,
            allowedRegions,
          },
          { status: 403 }
        );
      }

      return null; // Continue to next handler

    } catch (error) {
      console.error("CEMEX region middleware error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Region validation failed",
          code: "REGION_ERROR",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * CEMEX environment validation middleware
 * Validates user access to specific environment
 */
export function cemexEnvironmentMiddleware(allowedEnvironments: string[]) {
  return async (request: CemexAuthRequest): Promise<NextResponse | null> => {
    try {
      const user = request.cemexUser || getCemexAuthenticatedUser(request);

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "CEMEX authentication required",
            code: "AUTH_REQUIRED",
          },
          { status: 401 }
        );
      }

      if (!allowedEnvironments.includes(user.environment)) {
        return NextResponse.json(
          {
            success: false,
            error: `Access denied for environment: ${user.environment}. Allowed environments: ${allowedEnvironments.join(", ")}`,
            code: "ENVIRONMENT_ACCESS_DENIED",
            userEnvironment: user.environment,
            allowedEnvironments,
          },
          { status: 403 }
        );
      }

      return null; // Continue to next handler

    } catch (error) {
      console.error("CEMEX environment middleware error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Environment validation failed",
          code: "ENVIRONMENT_ERROR",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware composer for chaining multiple CEMEX middlewares
 */
export function composeCemexMiddleware(
  ...middlewares: Array<(request: CemexAuthRequest) => Promise<NextResponse | null>>
) {
  return async (request: CemexAuthRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) {
        return result; // Return error response if middleware fails
      }
    }
    return null; // All middlewares passed
  };
}

/**
 * Helper function to apply CEMEX middleware to API routes
 */
export function withCemexAuth(
  handler: (request: CemexAuthRequest) => Promise<NextResponse>,
  ...middlewares: Array<(request: CemexAuthRequest) => Promise<NextResponse | null>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const cemexRequest = request as CemexAuthRequest;
    
    // Apply all middlewares
    const composedMiddleware = composeCemexMiddleware(...middlewares);
    const middlewareResult = await composedMiddleware(cemexRequest);
    
    if (middlewareResult) {
      return middlewareResult; // Return error response from middleware
    }
    
    // All middlewares passed, execute handler
    return handler(cemexRequest);
  };
}
