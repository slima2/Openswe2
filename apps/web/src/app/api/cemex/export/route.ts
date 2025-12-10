import { NextRequest, NextResponse } from "next/server";
import { getCemexAuthenticatedUser, canPerformImportExport } from "@/lib/cemex-auth";

// Excel export functionality for CEMEX Configuration Console
// Supports exporting parameters, translations, and app keys to Excel format
// Implements environment hierarchy validation and file naming conventions

export async function GET(request: NextRequest) {
  try {
    // Authenticate user and check import/export permissions
    const user = await getCemexAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!hasImportExportAccess(user.cemexRole)) {
      return NextResponse.json(
        { 
          error: "Access denied", 
          message: "Only Console Admin users can export data" 
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get("type"); // parameters, translations, appkeys
    const environment = searchParams.get("environment");
    const region = searchParams.get("region");
    const serviceId = searchParams.get("serviceId");

    // Validate export type
    if (!exportType || !["parameters", "translations", "appkeys"].includes(exportType)) {
      return NextResponse.json(
        { error: "Invalid export type. Must be: parameters, translations, or appkeys" },
        { status: 400 }
      );
    }

    // Validate environment hierarchy (QA=1, PROD=2, Others=3)
    const environmentHierarchy = {
      QA: 1,
      PROD: 2,
      DEV: 3,
      DEV2: 3,
      QA2: 3,
      "PRE-PROD": 3,
      DEMO: 3,
    };

    if (environment && !environmentHierarchy[environment as keyof typeof environmentHierarchy]) {
      return NextResponse.json(
        { error: "Invalid environment specified" },
        { status: 400 }
      );
    }

    // Generate file name following CEMEX convention
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const environmentSuffix = environment ? `_${environment}` : "";
    const regionSuffix = region ? `_${region}` : "";
    const serviceSuffix = serviceId ? `_${serviceId}` : "";
    const fileName = `CEMEX_${exportType.toUpperCase()}${environmentSuffix}${regionSuffix}${serviceSuffix}_${timestamp}.xlsx`;

    // Get data based on export type
    let data: any[] = [];
    let headers: string[] = [];

    switch (exportType) {
      case "parameters":
        data = await getParametersForExport(environment, region, serviceId);
        headers = [
          "Service Name",
          "Service Code", 
          "Parameter Key",
          "Parameter Value",
          "Parameter Type",
          "Environment",
          "Region",
          "Is Active",
          "Created By",
          "Created At",
          "Updated At"
        ];
        break;

      case "translations":
        data = await getTranslationsForExport(environment, region);
        headers = [
          "Translation Key",
          "Language Code",
          "Translation Value",
          "Context",
          "Environment",
          "Region",
          "Is Active",
          "Created By",
          "Created At",
          "Updated At"
        ];
        break;

      case "appkeys":
        data = await getAppKeysForExport(environment, region);
        headers = [
          "Application Name",
          "Key Name",
          "Key Value",
          "Environment",
          "Region",
          "Expires At",
          "Is Active",
          "Created By",
          "Created At",
          "Updated At"
        ];
        break;
    }

    // Create Excel workbook (mock implementation - will use xlsx when installed)
    const excelData = createExcelWorkbook(data, headers, exportType);

    // Log export action for audit
    await logExportAction(user.id, exportType, environment, region, fileName);

    // Return Excel file
    return new NextResponse(excelData, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Mock data retrieval functions - In production, these would use Prisma
async function getParametersForExport(environment?: string | null, region?: string | null, serviceId?: string | null) {
  // Mock parameters data
  const mockParameters = [
    {
      serviceName: "User Authentication Service",
      serviceCode: "AUTH_SVC",
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
      serviceName: "User Authentication Service", 
      serviceCode: "AUTH_SVC",
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
      serviceName: "Payment Processing Service",
      serviceCode: "PAY_SVC",
      paramKey: "MAX_TRANSACTION_AMOUNT",
      paramValue: "10000.00",
      paramType: "DECIMAL",
      environment: "QA",
      region: "EUR",
      isActive: true,
      createdBy: "admin.user",
      createdAt: "2024-01-13T09:15:00Z",
      updatedAt: "2024-01-13T09:15:00Z",
    },
  ];

  // Apply filters
  let filteredData = mockParameters;
  
  if (environment) {
    filteredData = filteredData.filter(p => p.environment === environment);
  }
  
  if (region) {
    filteredData = filteredData.filter(p => p.region === region);
  }

  return filteredData;
}

async function getTranslationsForExport(environment?: string | null, region?: string | null) {
  // Mock translations data
  const mockTranslations = [
    {
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
  ];

  // Apply filters
  let filteredData = mockTranslations;
  
  if (environment) {
    filteredData = filteredData.filter(t => t.environment === environment);
  }
  
  if (region) {
    filteredData = filteredData.filter(t => t.region === region);
  }

  return filteredData;
}

async function getAppKeysForExport(environment?: string | null, region?: string | null) {
  // Mock app keys data
  const mockAppKeys = [
    {
      applicationName: "CEMEX Mobile App",
      keyName: "API_KEY",
      keyValue: "cmx_prod_api_key_12345",
      environment: "PROD",
      region: "AME",
      expiresAt: "2024-12-31T23:59:59Z",
      isActive: true,
      createdBy: "admin.user",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      applicationName: "CEMEX Web Portal",
      keyName: "ENCRYPTION_KEY",
      keyValue: "cmx_prod_enc_key_67890",
      environment: "PROD",
      region: "EUR",
      expiresAt: "2024-12-31T23:59:59Z",
      isActive: true,
      createdBy: "admin.user",
      createdAt: "2024-01-14T14:20:00Z",
      updatedAt: "2024-01-14T14:20:00Z",
    },
  ];

  // Apply filters
  let filteredData = mockAppKeys;
  
  if (environment) {
    filteredData = filteredData.filter(k => k.environment === environment);
  }
  
  if (region) {
    filteredData = filteredData.filter(k => k.region === region);
  }

  return filteredData;
}

// Mock Excel creation function - Will be replaced with actual xlsx implementation
function createExcelWorkbook(data: any[], headers: string[], exportType: string): Buffer {
  // This is a mock implementation that returns a simple CSV-like format
  // In production, this would use the xlsx library to create proper Excel files
  
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const key = header.toLowerCase().replace(/\s+/g, "");
        const value = row[key] || "";
        return `"${value}"`;
      }).join(",")
    )
  ].join("\n");

  // Return as buffer (mock - would be actual Excel buffer in production)
  return Buffer.from(csvContent, "utf-8");
}

// Mock audit logging function
async function logExportAction(userId: string, exportType: string, environment?: string | null, region?: string | null, fileName?: string) {
  // In production, this would log to the audit system
  console.log(`Export action logged: User ${userId} exported ${exportType} data`, {
    environment,
    region,
    fileName,
    timestamp: new Date().toISOString(),
  });
}

