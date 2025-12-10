import { NextRequest, NextResponse } from "next/server";
import { getCemexAuthenticatedUser, hasReadAccess, canPerformCRUD } from "@/lib/cemex-auth";

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

// GET - Retrieve single maintenance window by ID
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

    // Find maintenance window
    const maintenanceWindow = mockMaintenanceWindows.find((w) => w.id === id);
    if (!maintenanceWindow) {
      return NextResponse.json(
        { error: "Maintenance window not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ maintenanceWindow });

  } catch (error) {
    console.error("Get maintenance window error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve maintenance window" },
      { status: 500 }
    );
  }
}

// DELETE - Delete maintenance window by ID
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

    // Find maintenance window
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
          error: "Cannot delete active maintenance window", 
          message: "Maintenance windows cannot be deleted once they have started" 
        },
        { status: 400 }
      );
    }

    // Remove maintenance window
    const deletedWindow = mockMaintenanceWindows[windowIndex];
    mockMaintenanceWindows.splice(windowIndex, 1);

    return NextResponse.json({
      message: "YOUR MAINTENANCE WINDOW HAS BEEN DELETED SUCCESSFULLY",
      maintenanceWindow: deletedWindow,
    });

  } catch (error) {
    console.error("Delete maintenance window error:", error);
    return NextResponse.json(
      { error: "Failed to delete maintenance window" },
      { status: 500 }
    );
  }
}
