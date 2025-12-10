import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";

// CEMEX login validation schema
const cemexLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  region: z.enum(["AME", "EUR"]).optional(),
  environment: z.enum(["QA", "PROD"]).optional(),
});

// Mock CEMEX user database - In production, this would connect to CEMEX ID service
const mockCemexUsers = [
  {
    id: "cemex_admin_1",
    cemexId: "admin.user@cemex.com",
    username: "admin.user",
    email: "admin.user@cemex.com",
    name: "CEMEX Admin User",
    region: "AME",
    cemexRole: "Console Admin",
    department: "IT",
    isActive: true,
  },
  {
    id: "cemex_tech_1",
    cemexId: "tech.user@cemex.com",
    username: "tech.user",
    email: "tech.user@cemex.com",
    name: "CEMEX Technical User",
    region: "AME",
    cemexRole: "Technical",
    department: "Operations",
    isActive: true,
  },
  {
    id: "cemex_guest_1",
    cemexId: "guest.user@cemex.com",
    username: "guest.user",
    email: "guest.user@cemex.com",
    name: "CEMEX Guest User",
    region: "EUR",
    cemexRole: "Guest",
    department: "Business",
    isActive: true,
  },
];

/**
 * CEMEX ID Authentication endpoint
 * Handles corporate login with CEMEX credentials
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = cemexLoginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { username, password, region, environment } = validationResult.data;

    // Find user in CEMEX directory (mock implementation)
    const cemexUser = mockCemexUsers.find(
      (user) => user.username === username || user.cemexId === username
    );

    if (!cemexUser) {
      return NextResponse.json(
        {
          success: false,
          error: "THE USER OR PASSWORD YOU ENTERED ARE INCORRECT. PLEASE TRY AGAIN.",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    // For demo purposes, accept any password for mock users
    // In production, this would validate against CEMEX ID service
    const isValidPassword = true;

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "THE USER OR PASSWORD YOU ENTERED ARE INCORRECT. PLEASE TRY AGAIN.",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!cemexUser.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Account is disabled. Please contact your administrator.",
          code: "ACCOUNT_DISABLED",
        },
        { status: 403 }
      );
    }

    // Generate JWT token with CEMEX-specific claims
    const tokenPayload = {
      id: cemexUser.id,
      cemexId: cemexUser.cemexId,
      username: cemexUser.username,
      email: cemexUser.email,
      name: cemexUser.name,
      region: cemexUser.region,
      cemexRole: cemexUser.cemexRole,
      department: cemexUser.department,
      environment: environment || "QA",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || "cemex_secret_key");

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: cemexUser.id,
        cemexId: cemexUser.cemexId,
        username: cemexUser.username,
        email: cemexUser.email,
        name: cemexUser.name,
        region: cemexUser.region,
        cemexRole: cemexUser.cemexRole,
        department: cemexUser.department,
        environment: environment || "QA",
      },
      token,
    });

    // Set secure HTTP-only cookie for token
    response.cookies.set("cemex_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    // Set user info cookie for client-side access (non-sensitive data only)
    response.cookies.set("cemex_user_info", JSON.stringify({
      username: cemexUser.username,
      name: cemexUser.name,
      region: cemexUser.region,
      cemexRole: cemexUser.cemexRole,
      environment: environment || "QA",
    }), {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("CEMEX authentication error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Authentication service temporarily unavailable",
        code: "SERVICE_ERROR",
      },
      { status: 500 }
    );
  }
}
