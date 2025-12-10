import { NextRequest, NextResponse } from "next/server";
import { 
  getCemexAuthenticatedUser, 
  hasCemexRole, 
  CemexRole 
} from "@/lib/cemex-auth";

/**
 * CEMEX token validation endpoint
 * Validates token and checks role permissions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requiredRoles, checkImportExport } = body;

    const user = getCemexAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({
        valid: false,
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
    }

    // Check role requirements if specified
    if (requiredRoles && Array.isArray(requiredRoles)) {
      const hasRequiredRole = hasCemexRole(user, requiredRoles as CemexRole[]);
      if (!hasRequiredRole) {
        return NextResponse.json({
          valid: false,
          error: `Insufficient permissions. Required roles: ${requiredRoles.join(", ")}`,
          code: "INSUFFICIENT_PERMISSIONS",
          userRole: user.cemexRole,
          requiredRoles,
        });
      }
    }

    // Check import/export permissions if specified
    if (checkImportExport && user.cemexRole !== "Console Admin") {
      return NextResponse.json({
        valid: false,
        error: "Import/Export operations restricted to Console Admin only",
        code: "IMPORT_EXPORT_RESTRICTED",
        userRole: user.cemexRole,
      });
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        cemexId: user.cemexId,
        username: user.username,
        email: user.email,
        name: user.name,
        region: user.region,
        cemexRole: user.cemexRole,
        department: user.department,
        environment: user.environment,
      },
      permissions: {
        canImportExport: user.cemexRole === "Console Admin",
        canCRUD: ["Console Admin", "Technical"].includes(user.cemexRole),
        canRead: ["Console Admin", "Technical", "Guest"].includes(user.cemexRole),
      },
    });

  } catch (error) {
    console.error("CEMEX token validation error:", error);
    return NextResponse.json({
      valid: false,
      error: "Token validation failed",
      code: "VALIDATION_ERROR",
    });
  }
}
