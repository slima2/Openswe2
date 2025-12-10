import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export interface CemexUser {
  id: string;
  cemexId: string;
  username: string;
  email: string;
  name: string;
  region: string;
  cemexRole: string;
  department: string;
  environment: string;
}

export interface CemexJWTPayload extends CemexUser {
  iat?: number;
  exp?: number;
}

export type CemexRole = "Console Admin" | "Technical" | "Guest";

/**
 * CEMEX-specific cookie names
 */
export const CEMEX_AUTH_TOKEN_COOKIE = "cemex_auth_token";
export const CEMEX_USER_INFO_COOKIE = "cemex_user_info";

/**
 * Cookie options for CEMEX authentication cookies
 */
function getCemexCookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: expires ? undefined : 8 * 60 * 60, // 8 hours
    expires,
    path: "/",
  };
}

/**
 * Cookie options for CEMEX user info cookie (non-HTTP-only for client access)
 */
export function getCemexUserInfoCookieOptions(expires?: Date) {
  return {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: expires ? undefined : 8 * 60 * 60, // 8 hours
    expires,
    path: "/",
  };
}

/**
 * Stores CEMEX authentication token in secure HTTP-only cookie
 */
export function storeCemexToken(
  token: string,
  userInfo: Omit<CemexUser, "id">,
  response: NextResponse
): void {
  const cookieOptions = getCemexCookieOptions();
  const userInfoOptions = getCemexUserInfoCookieOptions();

  // Store token in secure HTTP-only cookie
  response.cookies.set(CEMEX_AUTH_TOKEN_COOKIE, token, cookieOptions);

  // Store non-sensitive user info for client-side access
  response.cookies.set(
    CEMEX_USER_INFO_COOKIE,
    JSON.stringify(userInfo),
    userInfoOptions
  );
}

/**
 * Retrieves CEMEX authentication token from cookies
 */
export function getCemexToken(request: NextRequest): string | null {
  try {
    return request.cookies.get(CEMEX_AUTH_TOKEN_COOKIE)?.value || null;
  } catch (error) {
    console.error("Error retrieving CEMEX token:", error);
    return null;
  }
}

/**
 * Retrieves CEMEX user info from cookies
 */
export function getCemexUserInfo(request: NextRequest): Omit<CemexUser, "id"> | null {
  try {
    const userInfoCookie = request.cookies.get(CEMEX_USER_INFO_COOKIE)?.value;
    if (!userInfoCookie) {
      return null;
    }
    return JSON.parse(userInfoCookie);
  } catch (error) {
    console.error("Error retrieving CEMEX user info:", error);
    return null;
  }
}

/**
 * Verifies and decodes CEMEX JWT token
 */
export function verifyCemexToken(token: string): CemexJWTPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "cemex_secret_key"
    ) as CemexJWTPayload;

    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Error verifying CEMEX token:", error);
    return null;
  }
}

/**
 * Removes CEMEX authentication cookies (logout)
 */
export function clearCemexToken(response: NextResponse): void {
  response.cookies.delete(CEMEX_AUTH_TOKEN_COOKIE);
  response.cookies.delete(CEMEX_USER_INFO_COOKIE);
}

/**
 * Checks if user has a valid CEMEX authentication token
 */
export function isCemexAuthenticated(request: NextRequest): boolean {
  const token = getCemexToken(request);
  if (!token) {
    return false;
  }

  const decoded = verifyCemexToken(token);
  return decoded !== null;
}

/**
 * Gets authenticated CEMEX user from request
 */
export function getCemexAuthenticatedUser(request: NextRequest): CemexUser | null {
  const token = getCemexToken(request);
  if (!token) {
    return null;
  }

  return verifyCemexToken(token);
}

/**
 * Checks if user has required CEMEX role
 */
export function hasCemexRole(user: CemexUser | null, requiredRoles: CemexRole[]): boolean {
  if (!user) {
    return false;
  }

  return requiredRoles.includes(user.cemexRole as CemexRole);
}

/**
 * Checks if user can perform import/export operations (Console Admin only)
 */
export function canPerformImportExport(user: CemexUser | null): boolean {
  return hasCemexRole(user, ["Console Admin"]);
}

/**
 * Checks if user can perform CRUD operations (Console Admin and Technical)
 */
export function canPerformCRUD(user: CemexUser | null): boolean {
  return hasCemexRole(user, ["Console Admin", "Technical"]);
}

/**
 * Checks if user has read-only access (all roles)
 */
export function hasReadAccess(user: CemexUser | null): boolean {
  return hasCemexRole(user, ["Console Admin", "Technical", "Guest"]);
}

/**
 * Environment hierarchy levels for import/export validation
 */
export const ENVIRONMENT_HIERARCHY = {
  QA: 1,
  PROD: 2,
  DEMO: 3,
  DEV: 3,
  DEV2: 3,
  QA2: 3,
  "PRE-PROD": 3,
} as const;

/**
 * Validates environment hierarchy for import operations
 * Rule: File environment level <= Current environment level
 */
export function validateEnvironmentHierarchy(
  fileEnvironment: string,
  currentEnvironment: string
): boolean {
  const fileLevel = ENVIRONMENT_HIERARCHY[fileEnvironment as keyof typeof ENVIRONMENT_HIERARCHY];
  const currentLevel = ENVIRONMENT_HIERARCHY[currentEnvironment as keyof typeof ENVIRONMENT_HIERARCHY];

  if (fileLevel === undefined || currentLevel === undefined) {
    return false;
  }

  return fileLevel <= currentLevel;
}

/**
 * Generates Excel file name according to CEMEX naming convention
 * Format: Env_Table_ISOCODE_Region_Environment_yyyymmdd
 */
export function generateExcelFileName(
  table: string,
  isoCode: string,
  region: string,
  environment: string
): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `Env_${table}_${isoCode}_${region}_${environment}_${date}.xlsx`;
}

/**
 * Validates Excel file name format
 */
export function validateExcelFileName(fileName: string): {
  isValid: boolean;
  parts?: {
    table: string;
    isoCode: string;
    region: string;
    environment: string;
    date: string;
  };
  error?: string;
} {
  const pattern = /^Env_(.+)_(.+)_(.+)_(.+)_(\d{8})\.xlsx$/;
  const match = fileName.match(pattern);

  if (!match) {
    return {
      isValid: false,
      error: "Invalid file name format. Expected: Env_Table_ISOCODE_Region_Environment_yyyymmdd.xlsx",
    };
  }

  const [, table, isoCode, region, environment, date] = match;

  return {
    isValid: true,
    parts: {
      table,
      isoCode,
      region,
      environment,
      date,
    },
  };
}
