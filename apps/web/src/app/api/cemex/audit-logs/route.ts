import { NextRequest, NextResponse } from "next/server";
import { getCemexAuthenticatedUser, hasReadAccess } from "@/lib/cemex-auth";
import { AuditLogger, AuditAction, CemexModule } from "@/lib/audit-logger";

// GET - Retrieve audit logs with filtering and pagination
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

    // Log audit log access
    await AuditLogger.logCRUD(
      AuditAction.READ,
      CemexModule.AUDIT_LOGS,
      "AuditLog",
      "multiple",
      user.id,
      undefined,
      undefined,
      request,
      { message: "Audit logs accessed" }
    );

    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const filters = {
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") as AuditAction || undefined,
      module: searchParams.get("module") as CemexModule || undefined,
      entityType: searchParams.get("entityType") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    // Validate limit and offset
    if (filters.limit > 1000) {
      return NextResponse.json(
        { error: "Limit cannot exceed 1000 records" },
        { status: 400 }
      );
    }

    if (filters.offset < 0) {
      return NextResponse.json(
        { error: "Offset cannot be negative" },
        { status: 400 }
      );
    }

    // Validate date filters
    if (filters.startDate && isNaN(Date.parse(filters.startDate))) {
      return NextResponse.json(
        { error: "Invalid start date format" },
        { status: 400 }
      );
    }

    if (filters.endDate && isNaN(Date.parse(filters.endDate))) {
      return NextResponse.json(
        { error: "Invalid end date format" },
        { status: 400 }
      );
    }

    // Get audit logs
    const result = await AuditLogger.getAuditLogs(filters);

    // Add user information to logs (for display purposes)
    const enrichedLogs = result.logs.map(log => ({
      ...log,
      // In production, this would join with user table to get user details
      userInfo: {
        id: log.userId,
        name: log.userId === "user-1" ? "Admin User" : 
              log.userId === "user-2" ? "Tech User" : "Unknown User",
        cemexRole: log.userId === "user-1" ? "Console Admin" : 
                   log.userId === "user-2" ? "Technical" : "Guest",
      },
    }));

    return NextResponse.json({
      auditLogs: enrichedLogs,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      filters: filters,
    });

  } catch (error) {
    console.error("Get audit logs error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve audit logs" },
      { status: 500 }
    );
  }
}

// POST - This endpoint is not typically used for audit logs as they are system-generated
// However, we can provide it for manual audit entries if needed
export async function POST(request: NextRequest) {
  try {
    // Authenticate user - only Console Admin can create manual audit entries
    const user = await getCemexAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.cemexRole !== "Console Admin") {
      return NextResponse.json(
        { error: "Access denied", message: "Only Console Admin can create manual audit entries" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields for manual audit entry
    if (!body.action || !body.entityType || !body.details) {
      return NextResponse.json(
        { error: "Missing required fields: action, entityType, details" },
        { status: 400 }
      );
    }

    // Create manual audit entry
    await AuditLogger.log({
      userId: user.id,
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      module: body.module || CemexModule.AUDIT_LOGS,
      tableName: body.tableName,
      recordId: body.recordId,
      oldValues: body.oldValues,
      newValues: body.newValues,
      ipAddress: AuditLogger['extractIpAddress'](request),
      userAgent: AuditLogger['extractUserAgent'](request),
      details: {
        ...body.details,
        manualEntry: true,
        createdBy: user.cemexId,
      },
    });

    return NextResponse.json(
      { message: "Manual audit entry created successfully" },
      { status: 201 }
    );

  } catch (error) {
    console.error("Create manual audit entry error:", error);
    return NextResponse.json(
      { error: "Failed to create manual audit entry" },
      { status: 500 }
    );
  }
}
