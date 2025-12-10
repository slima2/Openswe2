import { NextRequest, NextResponse } from "next/server";
import { getCemexAuthenticatedUser, hasReadAccess, canPerformCRUD } from "@/lib/cemex-auth";

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

// GET - Retrieve single translation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Find translation
    const translation = mockTranslations.find((t) => t.id === id);
    if (!translation) {
      return NextResponse.json(
        { error: "Translation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ translation });

  } catch (error) {
    console.error("Get translation error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve translation" },
      { status: 500 }
    );
  }
}

// DELETE - Delete translation by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Find translation
    const translationIndex = mockTranslations.findIndex((t) => t.id === id);
    if (translationIndex === -1) {
      return NextResponse.json(
        { error: "Translation not found" },
        { status: 404 }
      );
    }

    // Remove translation
    const deletedTranslation = mockTranslations[translationIndex];
    mockTranslations.splice(translationIndex, 1);

    return NextResponse.json({
      message: "YOUR TRANSLATION HAS BEEN DELETED SUCCESSFULLY",
      translation: deletedTranslation,
    });

  } catch (error) {
    console.error("Delete translation error:", error);
    return NextResponse.json(
      { error: "Failed to delete translation" },
      { status: 500 }
    );
  }
}



