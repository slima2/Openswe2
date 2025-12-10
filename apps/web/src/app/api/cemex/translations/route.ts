import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCemexAuthenticatedUser, hasReadAccess, canPerformCRUD } from "@/lib/cemex-auth";

// Translation validation schema
const translationSchema = z.object({
  translationKey: z.string().min(1, "Translation key is required").max(255, "Translation key too long"),
  languageCode: z.string().min(2, "Language code is required").max(5, "Language code too long"),
  translationValue: z.string().min(1, "Translation value is required"),
  context: z.string().optional(),
  environment: z.enum(["QA", "PROD", "DEMO", "DEV", "DEV2", "QA2", "PRE-PROD"]),
  region: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateTranslationSchema = translationSchema.partial().extend({
  id: z.string().min(1, "Translation ID is required"),
});

// Mock database - In production, this would use Prisma
let mockTranslations = [
  {
    id: "1",
    translationKey: "LOGIN_BUTTON",
    languageCode: "en",
    translationValue: "Login",
    context: "authentication",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    translationKey: "LOGIN_BUTTON",
    languageCode: "es",
    translationValue: "Iniciar Sesión",
    context: "authentication",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "3",
    translationKey: "LOGOUT_BUTTON",
    languageCode: "en",
    translationValue: "Logout",
    context: "authentication",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "tech.user",
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "4",
    translationKey: "LOGOUT_BUTTON",
    languageCode: "es",
    translationValue: "Cerrar Sesión",
    context: "authentication",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "tech.user",
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "5",
    translationKey: "WELCOME_MESSAGE",
    languageCode: "en",
    translationValue: "Welcome to CEMEX Portal",
    context: "general",
    environment: "QA",
    region: "EUR",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "6",
    translationKey: "WELCOME_MESSAGE",
    languageCode: "fr",
    translationValue: "Bienvenue sur le portail CEMEX",
    context: "general",
    environment: "QA",
    region: "EUR",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "7",
    translationKey: "ERROR_INVALID_CREDENTIALS",
    languageCode: "en",
    translationValue: "Invalid username or password",
    context: "error_messages",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-12T16:45:00Z",
    updatedAt: "2024-01-12T16:45:00Z",
  },
  {
    id: "8",
    translationKey: "ERROR_INVALID_CREDENTIALS",
    languageCode: "es",
    translationValue: "Usuario o contraseña inválidos",
    context: "error_messages",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-12T16:45:00Z",
    updatedAt: "2024-01-12T16:45:00Z",
  },
];

// GET - Retrieve translations with filtering and pagination
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
    const languageCode = searchParams.get("languageCode") || "";
    const context = searchParams.get("context") || "";
    const environment = searchParams.get("environment") || "";
    const region = searchParams.get("region") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Filter translations
    let filteredTranslations = mockTranslations;

    if (search) {
      filteredTranslations = filteredTranslations.filter(
        (t) =>
          t.translationKey.toLowerCase().includes(search.toLowerCase()) ||
          t.translationValue.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (languageCode) {
      filteredTranslations = filteredTranslations.filter(
        (t) => t.languageCode === languageCode
      );
    }

    if (context) {
      filteredTranslations = filteredTranslations.filter(
        (t) => t.context === context
      );
    }

    if (environment) {
      filteredTranslations = filteredTranslations.filter(
        (t) => t.environment === environment
      );
    }

    if (region) {
      filteredTranslations = filteredTranslations.filter(
        (t) => t.region === region
      );
    }

    // Apply pagination
    const paginatedTranslations = filteredTranslations.slice(offset, offset + limit);

    return NextResponse.json({
      translations: paginatedTranslations,
      total: filteredTranslations.length,
      limit,
      offset,
    });

  } catch (error) {
    console.error("Get translations error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve translations" },
      { status: 500 }
    );
  }
}

// POST - Create new translation
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
    const validationResult = translationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const translationData = validationResult.data;

    // Check for duplicate translation (same key + language + environment + region)
    const existingTranslation = mockTranslations.find(
      (t) =>
        t.translationKey === translationData.translationKey &&
        t.languageCode === translationData.languageCode &&
        t.environment === translationData.environment &&
        (t.region || "") === (translationData.region || "")
    );

    if (existingTranslation) {
      return NextResponse.json(
        { 
          error: "Duplicate translation", 
          message: "The Translation already exists for this key, language, environment, and region combination" 
        },
        { status: 409 }
      );
    }

    // Create new translation
    const newTranslation = {
      id: (mockTranslations.length + 1).toString(),
      ...translationData,
      createdBy: user.cemexId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockTranslations.push(newTranslation);

    return NextResponse.json(
      { 
        message: "YOUR TRANSLATION HAS BEEN SAVED",
        translation: newTranslation 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Create translation error:", error);
    return NextResponse.json(
      { error: "Failed to create translation" },
      { status: 500 }
    );
  }
}

// PUT - Update existing translation
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
    const validationResult = updateTranslationSchema.safeParse(body);
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

    // Find existing translation
    const translationIndex = mockTranslations.findIndex((t) => t.id === id);
    if (translationIndex === -1) {
      return NextResponse.json(
        { error: "Translation not found" },
        { status: 404 }
      );
    }

    // Check for duplicate if key/language/environment/region is being changed
    if (updateData.translationKey || updateData.languageCode || updateData.environment || updateData.region !== undefined) {
      const currentTranslation = mockTranslations[translationIndex];
      const newKey = updateData.translationKey || currentTranslation.translationKey;
      const newLanguage = updateData.languageCode || currentTranslation.languageCode;
      const newEnvironment = updateData.environment || currentTranslation.environment;
      const newRegion = updateData.region !== undefined ? updateData.region : currentTranslation.region;

      const duplicateTranslation = mockTranslations.find(
        (t) =>
          t.id !== id &&
          t.translationKey === newKey &&
          t.languageCode === newLanguage &&
          t.environment === newEnvironment &&
          (t.region || "") === (newRegion || "")
      );

      if (duplicateTranslation) {
        return NextResponse.json(
          { 
            error: "Duplicate translation", 
            message: "The Translation already exists for this key, language, environment, and region combination" 
          },
          { status: 409 }
        );
      }
    }

    // Update translation
    mockTranslations[translationIndex] = {
      ...mockTranslations[translationIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: "YOUR CHANGES HAVE BEEN SAVED",
      translation: mockTranslations[translationIndex],
    });

  } catch (error) {
    console.error("Update translation error:", error);
    return NextResponse.json(
      { error: "Failed to update translation" },
      { status: 500 }
    );
  }
}
