import { NextRequest, NextResponse } from "next/server";
import { getCemexAuthenticatedUser, hasReadAccess, canPerformCRUD } from "@/lib/cemex-auth";
import { AuditLogger, AuditAction, CemexModule, createAuditMiddleware } from "@/lib/audit-logger";

// Create audit middleware for app keys
const appKeyAudit = createAuditMiddleware(CemexModule.APP_KEYS, "AppKey");

// Mock database - In production, this would use Prisma
let mockAppKeys = [
  {
    id: "1",
    appName: "CEMEX Authentication Service",
    keyName: "JWT_SECRET_KEY",
    keyValue: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    environment: "PROD",
    region: "AME",
    expiresAt: "2024-12-31T23:59:59Z",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    appName: "CEMEX Authentication Service",
    keyName: "ENCRYPTION_KEY",
    keyValue: "AES256-GCM-SECRET-KEY-2024",
    environment: "PROD",
    region: "AME",
    expiresAt: "2024-12-31T23:59:59Z",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "3",
    appName: "CEMEX Email Service",
    keyName: "SMTP_API_KEY",
    keyValue: "smtp_key_prod_2024_secure",
    environment: "PROD",
    region: "EUR",
    expiresAt: "2024-06-30T23:59:59Z",
    isActive: true,
    createdBy: "tech.user",
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "4",
    appName: "CEMEX Payment Gateway",
    keyName: "PAYMENT_API_KEY",
    keyValue: "pay_prod_key_2024_encrypted",
    environment: "PROD",
    region: "AME",
    expiresAt: "2024-09-30T23:59:59Z",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-12T16:45:00Z",
    updatedAt: "2024-01-12T16:45:00Z",
  },
  {
    id: "5",
    appName: "CEMEX Mobile App",
    keyName: "PUSH_NOTIFICATION_KEY",
    keyValue: "fcm_server_key_2024_mobile",
    environment: "QA",
    region: "AME",
    expiresAt: "2024-08-31T23:59:59Z",
    isActive: true,
    createdBy: "tech.user",
    createdAt: "2024-01-11T11:30:00Z",
    updatedAt: "2024-01-11T11:30:00Z",
  },
  {
    id: "6",
    appName: "CEMEX Analytics Platform",
    keyName: "DATABASE_CONNECTION_KEY",
    keyValue: "db_conn_key_analytics_2024",
    environment: "QA",
    region: "EUR",
    expiresAt: "2024-07-31T23:59:59Z",
    isActive: false,
    createdBy: "admin.user",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
];

// GET - Retrieve single app key by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getCemexAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!hasReadAccess(user.cemexRole)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Find app key
    const appKey = mockAppKeys.find((key) => key.id === id);
    if (!appKey) {
      return NextResponse.json(
        { error: "App key not found" },
        { status: 404 }
      );
    }

    // Log read access
    await appKeyAudit.logRead(user.id, id, request, {
      message: "App key accessed",
      appName: appKey.appName,
      keyName: appKey.keyName,
    });

    // Mask sensitive key value for non-admin users
    const maskedAppKey = {
      ...appKey,
      keyValue: user.cemexRole === "Console Admin" ? appKey.keyValue : maskKeyValue(appKey.keyValue),
    };

    return NextResponse.json({ appKey: maskedAppKey });

  } catch (error) {
    console.error("Get app key error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve app key" },
      { status: 500 }
    );
  }
}

// DELETE - Delete app key by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user and check CRUD permissions
    const user = await getCemexAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!canPerformCRUD(user.cemexRole)) {
      return NextResponse.json(
        { error: "Access denied", message: "Insufficient permissions for this operation" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Find app key
    const appKeyIndex = mockAppKeys.findIndex((key) => key.id === id);
    if (appKeyIndex === -1) {
      return NextResponse.json(
        { error: "App key not found" },
        { status: 404 }
      );
    }

    const appKey = mockAppKeys[appKeyIndex];

    // Additional validation for production keys
    if (appKey.environment === "PROD") {
      // In production, you might want additional confirmation or restrictions
      // For now, we'll allow deletion but log it as a high-priority action
      await AuditLogger.log({
        userId: user.id,
        action: AuditAction.DELETE,
        entityType: "AppKey",
        entityId: id,
        module: CemexModule.APP_KEYS,
        tableName: "app_keys",
        recordId: id,
        oldValues: { ...appKey, keyValue: "[REDACTED]" },
        newValues: null,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        details: {
          message: "PRODUCTION APP KEY DELETED",
          priority: "HIGH",
          appName: appKey.appName,
          keyName: appKey.keyName,
          environment: appKey.environment,
        },
      });
    }

    // Remove app key
    const deletedAppKey = mockAppKeys[appKeyIndex];
    mockAppKeys.splice(appKeyIndex, 1);

    // Log deletion
    await appKeyAudit.logDelete(
      user.id,
      id,
      { ...deletedAppKey, keyValue: "[REDACTED]" },
      request,
      { 
        message: "App key deleted successfully",
        appName: deletedAppKey.appName,
        keyName: deletedAppKey.keyName,
      }
    );

    return NextResponse.json({
      message: "YOUR APP KEY HAS BEEN DELETED SUCCESSFULLY",
      appKey: { ...deletedAppKey, keyValue: "[REDACTED]" },
    });

  } catch (error) {
    console.error("Delete app key error:", error);
    return NextResponse.json(
      { error: "Failed to delete app key" },
      { status: 500 }
    );
  }
}

// Helper function to mask key values
function maskKeyValue(keyValue: string): string {
  if (!keyValue || keyValue.length <= 8) {
    return "••••••••";
  }
  
  const start = keyValue.substring(0, 4);
  const end = keyValue.substring(keyValue.length - 4);
  const middle = "•".repeat(Math.min(keyValue.length - 8, 20));
  
  return `${start}${middle}${end}`;
}
