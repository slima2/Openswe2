import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCemexAuthenticatedUser, hasReadAccess, canPerformCRUD } from "@/lib/cemex-auth";

// Maintenance Window validation schema
const maintenanceWindowSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start time"),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end time"),
  environment: z.enum(["QA", "PROD", "DEMO", "DEV", "DEV2", "QA2", "PRE-PROD"]),
  region: z.string().optional(),
  affectedServices: z.array(z.string()).optional(),
  maintenanceType: z.enum(["SCHEDULED", "EMERGENCY", "HOTFIX", "UPGRADE"]),
  isActive: z.boolean().default(true),
  notifyUsers: z.boolean().default(true),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

const updateMaintenanceWindowSchema = maintenanceWindowSchema.partial().extend({
  id: z.string().min(1, "Maintenance window ID is required"),
});

// Mock database - In production, this would use Prisma
let mockMaintenanceWindows = [
  {
    id: "1",
    title: "Database Maintenance",
    description: "Scheduled database optimization and backup",
    startTime: "2024-02-15T02:00:00Z",
    endTime: "2024-02-15T04:00:00Z",
    environment: "PROD",
    region: "AME",
    affectedServices: ["AUTH_SVC", "PAY_SVC"],
    maintenanceType: "SCHEDULED",
    isActive: true,
    notifyUsers: true,
    createdBy: "admin.user",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    title: "Security Patch Deployment",
    description: "Critical security updates for authentication service",
    startTime: "2024-02-10T01:00:00Z",
    endTime: "2024-02-10T02:30:00Z",
    environment: "PROD",
    region: "EUR",
    affectedServices: ["AUTH_SVC"],
    maintenanceType: "HOTFIX",
    isActive: true,
    notifyUsers: true,
    createdBy: "admin.user",
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "3",
    title: "Load Balancer Upgrade",
    description: "Upgrading load balancer infrastructure",
    startTime: "2024-02-20T03:00:00Z",
    endTime: "2024-02-20T05:00:00Z",
    environment: "QA",
    region: "AME",
    affectedServices: ["ALL"],
    maintenanceType: "UPGRADE",
    isActive: true,
    notifyUsers: false,
    createdBy: "tech.user",
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "4",
    title: "Emergency Network Fix",
    description: "Emergency fix for network connectivity issues",
    startTime: "2024-01-25T15:30:00Z",
    endTime: "2024-01-25T16:00:00Z",
    environment: "PROD",
    region: "AME",
    affectedServices: ["ALL"],
    maintenanceType: "EMERGENCY",
    isActive: false,
    notifyUsers: true,
    createdBy: "admin.user",
    createdAt: "2024-01-12T16:45:00Z",
    updatedAt: "2024-01-25T16:00:00Z",
  },
];

// GET - Retrieve maintenance windows with filtering and pagination
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const environment = searchParams.get("environment") || "";
    const region = searchParams.get("region") || "";
    const maintenanceType = searchParams.get("maintenanceType") || "";
    const isActive = searchParams.get("isActive");
    const upcoming = searchParams.get("upcoming") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Filter maintenance windows
    let filteredWindows = mockMaintenanceWindows;

    if (search) {
      filteredWindows = filteredWindows.filter(
        (w) =>
          w.title.toLowerCase().includes(search.toLowerCase()) ||
          w.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (environment) {
      filteredWindows = filteredWindows.filter(
        (w) => w.environment === environment
      );
    }

    if (region) {
      filteredWindows = filteredWindows.filter(
        (w) => w.region === region
      );
    }

    if (maintenanceType) {
      filteredWindows = filteredWindows.filter(
        (w) => w.maintenanceType === maintenanceType
      );
    }

    if (isActive !== null) {
      filteredWindows = filteredWindows.filter(
        (w) => w.isActive === (isActive === "true")
      );
    }

    if (upcoming) {
      const now = new Date();
      filteredWindows = filteredWindows.filter(
        (w) => new Date(w.startTime) > now
      );
    }

    // Sort by start time (upcoming first)
    filteredWindows.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Apply pagination
    const paginatedWindows = filteredWindows.slice(offset, offset + limit);

    return NextResponse.json({
      maintenanceWindows: paginatedWindows,
      total: filteredWindows.length,
      limit,
      offset,
    });

  } catch (error) {
    console.error("Get maintenance windows error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve maintenance windows" },
      { status: 500 }
    );
  }
}

// POST - Create new maintenance window
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
    const validationResult = maintenanceWindowSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const windowData = validationResult.data;

    // Additional validation for production environment
    if (windowData.environment === "PROD") {
      const startTime = new Date(windowData.startTime);
      const now = new Date();
      const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Require at least 24 hours notice for production maintenance
      if (hoursUntilStart < 24 && windowData.maintenanceType !== "EMERGENCY") {
        return NextResponse.json(
          { 
            error: "Production maintenance requires 24 hours advance notice", 
            message: "Production maintenance windows must be scheduled at least 24 hours in advance, except for emergency maintenance" 
          },
          { status: 400 }
        );
      }
    }

    // Check for overlapping maintenance windows in the same environment
    const overlappingWindow = mockMaintenanceWindows.find((w) => {
      if (w.environment !== windowData.environment || !w.isActive) return false;
      
      const existingStart = new Date(w.startTime);
      const existingEnd = new Date(w.endTime);
      const newStart = new Date(windowData.startTime);
      const newEnd = new Date(windowData.endTime);

      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });

    if (overlappingWindow) {
      return NextResponse.json(
        { 
          error: "Overlapping maintenance window", 
          message: `A maintenance window already exists for this time period in ${windowData.environment} environment` 
        },
        { status: 409 }
      );
    }

    // Create new maintenance window
    const newWindow = {
      id: (mockMaintenanceWindows.length + 1).toString(),
      ...windowData,
      createdBy: user.cemexId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockMaintenanceWindows.push(newWindow);

    return NextResponse.json(
      { 
        message: "YOUR MAINTENANCE WINDOW HAS BEEN SCHEDULED",
        maintenanceWindow: newWindow 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Create maintenance window error:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance window" },
      { status: 500 }
    );
  }
}

// PUT - Update existing maintenance window
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
    const validationResult = updateMaintenanceWindowSchema.safeParse(body);
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

    // Find existing maintenance window
    const windowIndex = mockMaintenanceWindows.findIndex((w) => w.id === id);
    if (windowIndex === -1) {
      return NextResponse.json(
        { error: "Maintenance window not found" },
        { status: 404 }
      );
    }

    const existingWindow = mockMaintenanceWindows[windowIndex];

    // Check if maintenance window has already started
    const now = new Date();
    const startTime = new Date(existingWindow.startTime);
    if (startTime <= now && existingWindow.isActive) {
      return NextResponse.json(
        { 
          error: "Cannot modify active maintenance window", 
          message: "Maintenance windows cannot be modified once they have started" 
        },
        { status: 400 }
      );
    }

    // Update maintenance window
    mockMaintenanceWindows[windowIndex] = {
      ...existingWindow,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: "YOUR CHANGES HAVE BEEN SAVED",
      maintenanceWindow: mockMaintenanceWindows[windowIndex],
    });

  } catch (error) {
    console.error("Update maintenance window error:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance window" },
      { status: 500 }
    );
  }
}
