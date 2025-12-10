import { NextRequest, NextResponse } from "next/server";

/**
 * CEMEX logout endpoint
 * Clears authentication cookies and invalidates session
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    });

    // Clear CEMEX authentication cookies
    response.cookies.delete("cemex_auth_token");
    response.cookies.delete("cemex_user_info");

    return response;

  } catch (error) {
    console.error("CEMEX logout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
        code: "LOGOUT_ERROR",
      },
      { status: 500 }
    );
  }
}
