import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCemexAuthenticatedUser, hasReadAccess, canPerformCRUD } from "@/lib/cemex-auth";
import { AuditLogger, AuditAction, CemexModule, createAuditMiddleware } from "@/lib/audit-logger";

// Create audit middleware for parameters
const parameterAudit = createAuditMiddleware(CemexModule.PARAMETERS, "ConfigurationParameter");

// Configuration Parameter validation schema
const configParameterSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  paramKey: z.string().min(1, "Parameter key is required").max(255, "Parameter key too long"),
  paramValue: z.string().optional(),
  paramType: z.string().optional().default("STRING"),
  environment: z.enum(["QA", "PROD", "DEMO", "DEV", "DEV2", "QA2", "PRE-PROD"]),
  region: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateConfigParameterSchema = configParameterSchema.partial().extend({
  id: z.string().min(1, "Parameter ID is required"),
});

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

const mockServices = [
  { id: "service-1", serviceName: "User Authentication Service", serviceCode: "AUTH_SVC" },
  { id: "service-2", serviceName: "Email Notification Service", serviceCode: "EMAIL_SVC" },
  { id: "service-3", serviceName: "Configuration Management Service", serviceCode: "CONFIG_SVC" },
];

/**
 * GET /api/cemex/parameters
 * Retrieve configuration parameters with filtering
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const environment = searchParams.get("environment");
    const region = searchParams.get("region");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Filter parameters
    let filteredParameters = mockParameters.filter(param => {
      if (serviceId && param.serviceId !== serviceId) return false;
      if (environment && param.environment !== environment) return false;
      if (region && param.region !== region) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          param.paramKey.toLowerCase().includes(searchLower) ||
          param.paramValue?.toLowerCase().includes(searchLower) ||
          param.serviceName.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

    // Pagination
    const total = filteredParameters.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedParameters = filteredParameters.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        parameters: paginatedParameters,
        services: mockServices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error("Error fetching parameters:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch configuration parameters",
        code: "FETCH_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cemex/parameters
 * Create a new configuration parameter
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validationResult = configParameterSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parameter data",
          details: validationResult.error.errors,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const paramData = validationResult.data;

    // Check for duplicate parameter (same serviceId, paramKey, environment, region)
    const existingParam = mockParameters.find(p => 
      p.serviceId === paramData.serviceId &&
      p.paramKey === paramData.paramKey &&
      p.environment === paramData.environment &&
      p.region === paramData.region
    );

    if (existingParam) {
      return NextResponse.json(
        {
          success: false,
          error: "The Registry already exists with the same service, key, environment, and region combination.",
          code: "DUPLICATE_PARAMETER",
        },
        { status: 409 }
      );
    }

    // Find service name
    const service = mockServices.find(s => s.id === paramData.serviceId);
    
    // Create new parameter
    const newParameter = {
      id: `param_${Date.now()}`,
      ...paramData,
      serviceName: service?.serviceName || "Unknown Service",
      createdBy: user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockParameters.push(newParameter);

    return NextResponse.json({
      success: true,
      message: "YOUR CHANGES HAVE BEEN SAVED",
      data: newParameter,
    });

  } catch (error) {
    console.error("Error creating parameter:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create configuration parameter",
        code: "CREATE_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cemex/parameters
 * Update an existing configuration parameter
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const validationResult = updateConfigParameterSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parameter data",
          details: validationResult.error.errors,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validationResult.data;

    // Find existing parameter
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

    // Check for duplicate if key fields are being updated
    if (updateData.serviceId || updateData.paramKey || updateData.environment || updateData.region) {
      const currentParam = mockParameters[paramIndex];
      const checkData = {
        serviceId: updateData.serviceId || currentParam.serviceId,
        paramKey: updateData.paramKey || currentParam.paramKey,
        environment: updateData.environment || currentParam.environment,
        region: updateData.region || currentParam.region,
      };

      const duplicateParam = mockParameters.find(p => 
        p.id !== id &&
        p.serviceId === checkData.serviceId &&
        p.paramKey === checkData.paramKey &&
        p.environment === checkData.environment &&
        p.region === checkData.region
      );

      if (duplicateParam) {
        return NextResponse.json(
          {
            success: false,
            error: "The Registry already exists with the same service, key, environment, and region combination.",
            code: "DUPLICATE_PARAMETER",
          },
          { status: 409 }
        );
      }
    }

    // Update parameter
    const updatedParameter = {
      ...mockParameters[paramIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // Update service name if serviceId changed
    if (updateData.serviceId) {
      const service = mockServices.find(s => s.id === updateData.serviceId);
      updatedParameter.serviceName = service?.serviceName || "Unknown Service";
    }

    mockParameters[paramIndex] = updatedParameter;

    return NextResponse.json({
      success: true,
      message: "YOUR CHANGES HAVE BEEN SAVED",
      data: updatedParameter,
    });

  } catch (error) {
    console.error("Error updating parameter:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update configuration parameter",
        code: "UPDATE_ERROR",
      },
      { status: 500 }
    );
  }
}

