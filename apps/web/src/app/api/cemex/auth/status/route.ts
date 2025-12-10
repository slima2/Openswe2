import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface CemexJWTPayload {
  id: string;
  cemexId: string;
  username: string;
  email: string;
  name: string;
  region: string;
  cemexRole: string;
  department: string;
  environment: string;
  iat?: number;
  exp?: number;
}

/**
 * CEMEX authentication status endpoint
 * Checks if user has valid CEMEX authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("cemex_auth_token")?.value;

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "cemex_secret_key") as CemexJWTPayload;

    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        error: "Token expired",
      });
    }

    // Return user information
    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.id,
        cemexId: decoded.cemexId,
        username: decoded.username,
        email: decoded.email,
        name: decoded.name,
        region: decoded.region,
        cemexRole: decoded.cemexRole,
        department: decoded.department,
        environment: decoded.environment,
      },
    });

  } catch (error) {
    console.error("CEMEX auth status error:", error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: "Invalid token",
    });
  }
}
