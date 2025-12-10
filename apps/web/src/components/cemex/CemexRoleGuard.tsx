import React from "react";
import { useCemexAuth } from "@/hooks/useCemexAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Shield, Lock } from "lucide-react";

export type CemexRole = "Console Admin" | "Technical" | "Guest";

interface CemexRoleGuardProps {
  children: React.ReactNode;
  requiredRoles: CemexRole[];
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

interface CemexAccessControlProps {
  children: React.ReactNode;
  requireImportExport?: boolean;
  requireCRUD?: boolean;
  requireRead?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Role-based access control component for CEMEX console
 * Renders children only if user has one of the required roles
 */
export function CemexRoleGuard({ 
  children, 
  requiredRoles, 
  fallback,
  showFallback = true 
}: CemexRoleGuardProps) {
  const { user, hasRole } = useCemexAuth();

  // If user is not authenticated, show authentication required message
  if (!user) {
    if (!showFallback) return null;
    
    return fallback || (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Lock className="h-5 w-5" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please log in to access this feature
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Check if user has any of the required roles
  const hasRequiredRole = requiredRoles.some(role => hasRole(role));

  if (!hasRequiredRole) {
    if (!showFallback) return null;

    return fallback || (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Access Denied
          </CardTitle>
          <CardDescription>
            Your role ({user.cemexRole}) does not have permission to access this feature.
            Required roles: {requiredRoles.join(", ")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <>{children}</>;
}

/**
 * Access control component based on CEMEX permission levels
 * More semantic than role-based guards
 */
export function CemexAccessControl({
  children,
  requireImportExport = false,
  requireCRUD = false,
  requireRead = false,
  fallback,
  showFallback = true
}: CemexAccessControlProps) {
  const { user, hasImportExportAccess, canPerformCRUD, hasReadAccess } = useCemexAuth();

  // If user is not authenticated, show authentication required message
  if (!user) {
    if (!showFallback) return null;
    
    return fallback || (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Lock className="h-5 w-5" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please log in to access this feature
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Check permissions based on requirements
  let hasPermission = true;
  let requiredPermission = "";

  if (requireImportExport && !hasImportExportAccess()) {
    hasPermission = false;
    requiredPermission = "Import/Export (Console Admin only)";
  } else if (requireCRUD && !canPerformCRUD()) {
    hasPermission = false;
    requiredPermission = "Create/Update/Delete (Console Admin or Technical)";
  } else if (requireRead && !hasReadAccess()) {
    hasPermission = false;
    requiredPermission = "Read access";
  }

  if (!hasPermission) {
    if (!showFallback) return null;

    return fallback || (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Insufficient Permissions
          </CardTitle>
          <CardDescription>
            Your role ({user.cemexRole}) does not have permission for this operation.
            Required permission: {requiredPermission}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <>{children}</>;
}

/**
 * HOC for wrapping components with role-based access control
 */
export function withCemexRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: CemexRole[],
  fallback?: React.ReactNode
) {
  const WrappedComponent = (props: P) => {
    return (
      <CemexRoleGuard requiredRoles={requiredRoles} fallback={fallback}>
        <Component {...props} />
      </CemexRoleGuard>
    );
  };

  WrappedComponent.displayName = `withCemexRoleGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * HOC for wrapping components with permission-based access control
 */
export function withCemexAccessControl<P extends object>(
  Component: React.ComponentType<P>,
  permissions: {
    requireImportExport?: boolean;
    requireCRUD?: boolean;
    requireRead?: boolean;
  },
  fallback?: React.ReactNode
) {
  const WrappedComponent = (props: P) => {
    return (
      <CemexAccessControl {...permissions} fallback={fallback}>
        <Component {...props} />
      </CemexAccessControl>
    );
  };

  WrappedComponent.displayName = `withCemexAccessControl(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * Hook for conditional rendering based on roles
 */
export function useCemexRoleGuard(requiredRoles: CemexRole[]) {
  const { user, hasRole } = useCemexAuth();

  const hasRequiredRole = user && requiredRoles.some(role => hasRole(role));
  const isAuthenticated = !!user;

  return {
    hasAccess: hasRequiredRole,
    isAuthenticated,
    userRole: user?.cemexRole,
    canRender: hasRequiredRole,
  };
}

/**
 * Hook for conditional rendering based on permissions
 */
export function useCemexAccessControl(permissions: {
  requireImportExport?: boolean;
  requireCRUD?: boolean;
  requireRead?: boolean;
}) {
  const { user, hasImportExportAccess, canPerformCRUD, hasReadAccess } = useCemexAuth();

  let hasPermission = true;
  let requiredPermission = "";

  if (permissions.requireImportExport && !hasImportExportAccess()) {
    hasPermission = false;
    requiredPermission = "Import/Export";
  } else if (permissions.requireCRUD && !canPerformCRUD()) {
    hasPermission = false;
    requiredPermission = "CRUD operations";
  } else if (permissions.requireRead && !hasReadAccess()) {
    hasPermission = false;
    requiredPermission = "Read access";
  }

  return {
    hasAccess: hasPermission,
    isAuthenticated: !!user,
    userRole: user?.cemexRole,
    canRender: hasPermission,
    requiredPermission,
  };
}

/**
 * Component for displaying user's current access level
 */
export function CemexAccessLevelIndicator() {
  const { user, hasImportExportAccess, canPerformCRUD, hasReadAccess } = useCemexAuth();

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Not authenticated</span>
      </div>
    );
  }

  let accessLevel = "No access";
  let accessColor = "text-destructive";
  let accessIcon = <Lock className="h-4 w-4" />;

  if (hasImportExportAccess()) {
    accessLevel = "Full access (Import/Export)";
    accessColor = "text-green-600";
    accessIcon = <Shield className="h-4 w-4" />;
  } else if (canPerformCRUD()) {
    accessLevel = "CRUD access";
    accessColor = "text-blue-600";
    accessIcon = <AlertCircle className="h-4 w-4" />;
  } else if (hasReadAccess()) {
    accessLevel = "Read-only access";
    accessColor = "text-yellow-600";
    accessIcon = <AlertCircle className="h-4 w-4" />;
  }

  return (
    <div className={`flex items-center gap-2 ${accessColor}`}>
      {accessIcon}
      <span className="text-sm">
        {user.cemexRole} - {accessLevel}
      </span>
    </div>
  );
}
