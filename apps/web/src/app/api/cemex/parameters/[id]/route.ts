import { NextRequest, NextResponse } from "next/server";
import { getCemexAuthenticatedUser, hasReadAccess, canPerformCRUD } from "@/lib/cemex-auth";

// Mock database - In production, this would use Prisma
let mockParameters = [
  {
    id: "1",
    serviceId: "service-1",
    serviceName: "User Authentication Service",
    paramKey: "MAX_LOGIN_ATTEMPTS",
    paramValue: "5",
    paramType: "INTEGER",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    serviceId: "service-1",
    serviceName: "User Authentication Service",
    paramKey: "SESSION_TIMEOUT",
    paramValue: "3600",
    paramType: "INTEGER",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "tech.user",
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "3",
    serviceId: "service-2",
    serviceName: "Email Notification Service",
    paramKey: "SMTP_HOST",
    paramValue: "smtp.cemex.com",
    paramType: "STRING",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
];

/**
 * GET /api/cemex/parameters/[id]
 * Retrieve a specific configuration parameter
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCemexAuthenticatedUser(request);
    
    if (!user || !hasReadAccess(user)) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Insufficient permissions.",
          code: "ACCESS_DENIED",
        },
        { status: 403 }
      );
    }

    const { id } = params;
    const parameter = mockParameters.find(p => p.id === id);

    if (!parameter) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuration parameter not found",
          code: "PARAMETER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parameter,
    });

  } catch (error) {
    console.error("Error fetching parameter:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch configuration parameter",
        code: "FETCH_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cemex/parameters/[id]
 * Delete a configuration parameter
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCemexAuthenticatedUser(request);
    
    if (!user || !canPerformCRUD(user)) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. CRUD operations require Technical or Console Admin role.",
          code: "ACCESS_DENIED",
        },
        { status: 403 }
      );
    }

    const { id } = params;
    const paramIndex = mockParameters.findIndex(p => p.id === id);

    if (paramIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuration parameter not found",
          code: "PARAMETER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const deletedParameter = mockParameters[paramIndex];
    
    // Check for Plant Region deletion restrictions (>5 deletions)
    const { searchParams } = new URL(request.url);
    const bulkDelete = searchParams.get("bulk") === "true";
    const deleteCount = parseInt(searchParams.get("count") || "1");

    if (bulkDelete && deleteCount > 5 && deletedParameter.region === "PLANT") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete more than 5 parameters simultaneously in PLANT REGION for security reasons.",
          code: "BULK_DELETE_RESTRICTED",
        },
        { status: 400 }
      );
    }

    // Remove parameter from mock database
    mockParameters.splice(paramIndex, 1);

    return NextResponse.json({
      success: true,
      message: "YOUR PARAMETER HAS BEEN DELETED SUCCESSFULLY",
      data: { id, deletedParameter },
    });

  } catch (error) {
    console.error("Error deleting parameter:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete configuration parameter",
        code: "DELETE_ERROR",
      },
      { status: 500 }
    );
  }
}
