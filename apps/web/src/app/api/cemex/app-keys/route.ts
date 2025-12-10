import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCemexAuthenticatedUser, hasReadAccess, canPerformCRUD } from "@/lib/cemex-auth";
import { AuditLogger, AuditAction, CemexModule, createAuditMiddleware } from "@/lib/audit-logger";

// Create audit middleware for app keys
const appKeyAudit = createAuditMiddleware(CemexModule.APP_KEYS, "AppKey");

// App Key validation schema
const appKeySchema = z.object({
  appName: z.string().min(1, "Application name is required").max(100, "Application name too long"),
  keyName: z.string().min(1, "Key name is required").max(255, "Key name too long"),
  keyValue: z.string().optional(),
  environment: z.enum(["QA", "PROD", "DEMO", "DEV", "DEV2", "QA2", "PRE-PROD"]),
  region: z.string().optional(),
  expiresAt: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), "Invalid expiration date"),
  isActive: z.boolean().default(true),
});

const updateAppKeySchema = appKeySchema.partial().extend({
  id: z.string().min(1, "App key ID is required"),
});

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

// GET - Retrieve app keys with filtering and pagination
export async function GET(request: NextRequest) {
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

    // Log read access
    await appKeyAudit.logRead(user.id, "multiple", request, {
      message: "App keys accessed",
      userRole: user.cemexRole,
    });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const appName = searchParams.get("appName") || "";
    const environment = searchParams.get("environment") || "";
    const region = searchParams.get("region") || "";
    const isActive = searchParams.get("isActive");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Filter app keys
    let filteredAppKeys = mockAppKeys;

    if (search) {
      filteredAppKeys = filteredAppKeys.filter(
        (key) =>
          key.appName.toLowerCase().includes(search.toLowerCase()) ||
          key.keyName.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (appName) {
      filteredAppKeys = filteredAppKeys.filter(
        (key) => key.appName === appName
      );
    }

    if (environment) {
      filteredAppKeys = filteredAppKeys.filter(
        (key) => key.environment === environment
      );
    }

    if (region) {
      filteredAppKeys = filteredAppKeys.filter(
        (key) => key.region === region
      );
    }

    if (isActive !== null) {
      filteredAppKeys = filteredAppKeys.filter(
        (key) => key.isActive === (isActive === "true")
      );
    }

    // Apply pagination
    const paginatedAppKeys = filteredAppKeys.slice(offset, offset + limit);

    // Mask sensitive key values for non-admin users
    const maskedAppKeys = paginatedAppKeys.map(key => ({
      ...key,
      keyValue: user.cemexRole === "Console Admin" ? key.keyValue : maskKeyValue(key.keyValue),
    }));

    return NextResponse.json({
      appKeys: maskedAppKeys,
      total: filteredAppKeys.length,
      limit,
      offset,
    });

  } catch (error) {
    console.error("Get app keys error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve app keys" },
      { status: 500 }
    );
  }
}

// POST - Create new app key
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate input
    const validationResult = appKeySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const appKeyData = validationResult.data;

    // Check for duplicate app key (same app + key name + environment + region)
    const existingAppKey = mockAppKeys.find(
      (key) =>
        key.appName === appKeyData.appName &&
        key.keyName === appKeyData.keyName &&
        key.environment === appKeyData.environment &&
        (key.region || "") === (appKeyData.region || "")
    );

    if (existingAppKey) {
      return NextResponse.json(
        { 
          error: "Duplicate app key", 
          message: "The App Key already exists for this application, key name, environment, and region combination" 
        },
        { status: 409 }
      );
    }

    // Validate expiration date
    if (appKeyData.expiresAt) {
      const expirationDate = new Date(appKeyData.expiresAt);
      const now = new Date();
      if (expirationDate <= now) {
        return NextResponse.json(
          { error: "Invalid expiration date", message: "Expiration date must be in the future" },
          { status: 400 }
        );
      }
    }

    // Create new app key
    const newAppKey = {
      id: (mockAppKeys.length + 1).toString(),
      ...appKeyData,
      createdBy: user.cemexId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockAppKeys.push(newAppKey);

    // Log creation
    await appKeyAudit.logCreate(
      user.id,
      newAppKey.id,
      { ...newAppKey, keyValue: "[REDACTED]" }, // Don't log actual key value
      request,
      { message: "App key created successfully" }
    );

    return NextResponse.json(
      { 
        message: "YOUR APP KEY HAS BEEN SAVED",
        appKey: { ...newAppKey, keyValue: "[REDACTED]" } // Don't return actual key value
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Create app key error:", error);
    return NextResponse.json(
      { error: "Failed to create app key" },
      { status: 500 }
    );
  }
}

// PUT - Update existing app key
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate input
    const validationResult = updateAppKeySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validationResult.data;

    // Find existing app key
    const appKeyIndex = mockAppKeys.findIndex((key) => key.id === id);
    if (appKeyIndex === -1) {
      return NextResponse.json(
        { error: "App key not found" },
        { status: 404 }
      );
    }

    const oldAppKey = { ...mockAppKeys[appKeyIndex] };

    // Check for duplicate if app/key/environment/region is being changed
    if (updateData.appName || updateData.keyName || updateData.environment || updateData.region !== undefined) {
      const currentAppKey = mockAppKeys[appKeyIndex];
      const newAppName = updateData.appName || currentAppKey.appName;
      const newKeyName = updateData.keyName || currentAppKey.keyName;
      const newEnvironment = updateData.environment || currentAppKey.environment;
      const newRegion = updateData.region !== undefined ? updateData.region : currentAppKey.region;

      const duplicateAppKey = mockAppKeys.find(
        (key) =>
          key.id !== id &&
          key.appName === newAppName &&
          key.keyName === newKeyName &&
          key.environment === newEnvironment &&
          (key.region || "") === (newRegion || "")
      );

      if (duplicateAppKey) {
        return NextResponse.json(
          { 
            error: "Duplicate app key", 
            message: "The App Key already exists for this application, key name, environment, and region combination" 
          },
          { status: 409 }
        );
      }
    }

    // Validate expiration date if being updated
    if (updateData.expiresAt) {
      const expirationDate = new Date(updateData.expiresAt);
      const now = new Date();
      if (expirationDate <= now) {
        return NextResponse.json(
          { error: "Invalid expiration date", message: "Expiration date must be in the future" },
          { status: 400 }
        );
      }
    }

    // Update app key
    mockAppKeys[appKeyIndex] = {
      ...mockAppKeys[appKeyIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const updatedAppKey = mockAppKeys[appKeyIndex];

    // Log update
    await appKeyAudit.logUpdate(
      user.id,
      id,
      { ...oldAppKey, keyValue: "[REDACTED]" },
      { ...updatedAppKey, keyValue: "[REDACTED]" },
      request,
      { message: "App key updated successfully" }
    );

    return NextResponse.json({
      message: "YOUR CHANGES HAVE BEEN SAVED",
      appKey: { ...updatedAppKey, keyValue: "[REDACTED]" },
    });

  } catch (error) {
    console.error("Update app key error:", error);
    return NextResponse.json(
      { error: "Failed to update app key" },
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
