import { NextRequest, NextResponse } from "next/server";
import { getCemexAuthenticatedUser, hasCemexRole, canPerformImportExport, canPerformCRUD, hasReadAccess } from "@/lib/cemex-auth";
import { AuditLogger, AuditAction, CemexModule } from "@/lib/audit-logger";

/**
 * API route to check CEMEX authentication status and permissions
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCemexAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        user: null,
        permissions: null
      });
    }

    // Calculate user permissions
    const permissions = {
      hasReadAccess: hasReadAccess(user.cemexRole),
      canPerformCRUD: canPerformCRUD(user.cemexRole),
      hasImportExportAccess: canPerformImportExport(user.cemexRole),
      isConsoleAdmin: hasCemexRole(user, ["Console Admin"]),
      isTechnical: hasCemexRole(user, ["Technical"]),
      isGuest: hasCemexRole(user, ["Guest"]),
    };

    // Log authentication status check
    await AuditLogger.logAuth(
      AuditAction.READ,
      user.id,
      request,
      {
        message: "CEMEX authentication status checked",
        userRole: user.cemexRole,
        permissions,
      }
    );

    // Return user info without sensitive data
    const safeUser = {
      id: user.id,
      cemexId: user.cemexId,
      username: user.username,
      email: user.email,
      name: user.name,
      region: user.region,
      cemexRole: user.cemexRole,
      department: user.department,
      environment: user.environment,
    };

    return NextResponse.json({
      authenticated: true,
      user: safeUser,
      permissions,
    });

  } catch (error) {
    console.error("Error checking CEMEX auth status:", error);
    
    // Log failed authentication check
    await AuditLogger.log({
      userId: "unknown",
      action: AuditAction.ACCESS_DENIED,
      entityType: "AuthStatus",
      module: CemexModule.AUTHENTICATION,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to check CEMEX authentication status",
      },
    });

    return NextResponse.json(
      { 
        authenticated: false, 
        user: null,
        permissions: null,
        error: "Failed to check authentication status" 
      },
      { status: 500 }
    );
  }
}
