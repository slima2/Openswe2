import { NextRequest, NextResponse } from "next/server";
import { getCemexAuthenticatedUser, hasImportExportAccess } from "@/lib/cemex-auth";

// Excel import functionality for CEMEX Configuration Console
// Supports importing parameters, translations, and app keys from Excel format
// Implements environment hierarchy validation and file naming convention enforcement

export async function POST(request: NextRequest) {
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
          message: "Only Console Admin users can import data" 
        },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const importType = formData.get("type") as string; // parameters, translations, appkeys
    const environment = formData.get("environment") as string;
    const region = formData.get("region") as string;
    const overwriteExisting = formData.get("overwriteExisting") === "true";

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Invalid file type. Only Excel files (.xlsx, .xls) are allowed" },
        { status: 400 }
      );
    }

    // Validate import type
    if (!importType || !["parameters", "translations", "appkeys"].includes(importType)) {
      return NextResponse.json(
        { error: "Invalid import type. Must be: parameters, translations, or appkeys" },
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

    if (!environment || !environmentHierarchy[environment as keyof typeof environmentHierarchy]) {
      return NextResponse.json(
        { error: "Valid environment is required" },
        { status: 400 }
      );
    }

    // Validate file naming convention
    const expectedPrefix = `CEMEX_${importType.toUpperCase()}`;
    if (!file.name.toUpperCase().startsWith(expectedPrefix)) {
      return NextResponse.json(
        { 
          error: "Invalid file name", 
          message: `File name must start with ${expectedPrefix}` 
        },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Parse Excel file
    const fileBuffer = await file.arrayBuffer();
    const importResult = await parseExcelFile(fileBuffer, importType, environment, region, overwriteExisting, user.id);

    // Log import action for audit
    await logImportAction(user.id, importType, environment, region, file.name, importResult);

    return NextResponse.json({
      success: true,
      message: "Data imported successfully",
      result: importResult,
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Mock Excel parsing function - Will be replaced with actual xlsx implementation
async function parseExcelFile(
  fileBuffer: ArrayBuffer, 
  importType: string, 
  environment: string, 
  region: string, 
  overwriteExisting: boolean,
  userId: string
) {
  // This is a mock implementation
  // In production, this would use the xlsx library to parse the Excel file
  
  const mockResult = {
    totalRows: 0,
    successfulImports: 0,
    skippedRows: 0,
    errors: [] as string[],
    warnings: [] as string[],
  };

  // Mock data based on import type
  switch (importType) {
    case "parameters":
      mockResult.totalRows = 15;
      mockResult.successfulImports = 12;
      mockResult.skippedRows = 2;
      mockResult.errors = ["Row 5: Invalid parameter type 'INVALID'"];
      mockResult.warnings = ["Row 8: Parameter already exists, skipped (overwrite disabled)"];
      break;

    case "translations":
      mockResult.totalRows = 25;
      mockResult.successfulImports = 23;
      mockResult.skippedRows = 1;
      mockResult.errors = ["Row 12: Invalid language code 'xyz'"];
      mockResult.warnings = ["Row 15: Translation already exists, updated"];
      break;

    case "appkeys":
      mockResult.totalRows = 8;
      mockResult.successfulImports = 7;
      mockResult.skippedRows = 0;
      mockResult.errors = ["Row 3: Invalid expiration date format"];
      mockResult.warnings = [];
      break;
  }

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  return mockResult;
}

// Validate Excel data based on import type
function validateExcelData(data: any[], importType: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (importType) {
    case "parameters":
      // Validate required columns for parameters
      const requiredParamColumns = ["Service Name", "Parameter Key", "Parameter Type", "Environment"];
      data.forEach((row, index) => {
        requiredParamColumns.forEach(col => {
          if (!row[col]) {
            errors.push(`Row ${index + 2}: Missing required field '${col}'`);
          }
        });

        // Validate parameter type
        const validTypes = ["STRING", "INTEGER", "DECIMAL", "BOOLEAN", "JSON"];
        if (row["Parameter Type"] && !validTypes.includes(row["Parameter Type"])) {
          errors.push(`Row ${index + 2}: Invalid parameter type '${row["Parameter Type"]}'`);
        }

        // Validate environment
        const validEnvironments = ["QA", "PROD", "DEV", "DEV2", "QA2", "PRE-PROD", "DEMO"];
        if (row["Environment"] && !validEnvironments.includes(row["Environment"])) {
          errors.push(`Row ${index + 2}: Invalid environment '${row["Environment"]}'`);
        }
      });
      break;

    case "translations":
      // Validate required columns for translations
      const requiredTransColumns = ["Translation Key", "Language Code", "Translation Value", "Environment"];
      data.forEach((row, index) => {
        requiredTransColumns.forEach(col => {
          if (!row[col]) {
            errors.push(`Row ${index + 2}: Missing required field '${col}'`);
          }
        });

        // Validate language code (ISO 639-1)
        const validLanguages = ["en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"];
        if (row["Language Code"] && !validLanguages.includes(row["Language Code"])) {
          errors.push(`Row ${index + 2}: Invalid language code '${row["Language Code"]}'`);
        }
      });
      break;

    case "appkeys":
      // Validate required columns for app keys
      const requiredKeyColumns = ["Application Name", "Key Name", "Environment"];
      data.forEach((row, index) => {
        requiredKeyColumns.forEach(col => {
          if (!row[col]) {
            errors.push(`Row ${index + 2}: Missing required field '${col}'`);
          }
        });

        // Validate expiration date format
        if (row["Expires At"]) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
          if (!dateRegex.test(row["Expires At"])) {
            errors.push(`Row ${index + 2}: Invalid expiration date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)`);
          }
        }
      });
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Process import data based on type
async function processImportData(
  data: any[], 
  importType: string, 
  environment: string, 
  region: string, 
  overwriteExisting: boolean,
  userId: string
) {
  const result = {
    successfulImports: 0,
    skippedRows: 0,
    errors: [] as string[],
    warnings: [] as string[],
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // Excel row number (accounting for header)

    try {
      switch (importType) {
        case "parameters":
          await processParameterRow(row, environment, region, overwriteExisting, userId, rowNumber, result);
          break;
        case "translations":
          await processTranslationRow(row, environment, region, overwriteExisting, userId, rowNumber, result);
          break;
        case "appkeys":
          await processAppKeyRow(row, environment, region, overwriteExisting, userId, rowNumber, result);
          break;
      }
    } catch (error) {
      result.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return result;
}

// Mock processing functions - In production, these would use Prisma
async function processParameterRow(row: any, environment: string, region: string, overwriteExisting: boolean, userId: string, rowNumber: number, result: any) {
  // Mock parameter processing
  const paramKey = row["Parameter Key"];
  const serviceCode = row["Service Code"];
  
  // Check if parameter already exists
  const exists = Math.random() > 0.8; // Mock 20% chance of existing
  
  if (exists && !overwriteExisting) {
    result.skippedRows++;
    result.warnings.push(`Row ${rowNumber}: Parameter '${paramKey}' already exists, skipped`);
    return;
  }

  // Mock successful import
  result.successfulImports++;
}

async function processTranslationRow(row: any, environment: string, region: string, overwriteExisting: boolean, userId: string, rowNumber: number, result: any) {
  // Mock translation processing
  const translationKey = row["Translation Key"];
  const languageCode = row["Language Code"];
  
  // Check if translation already exists
  const exists = Math.random() > 0.9; // Mock 10% chance of existing
  
  if (exists && !overwriteExisting) {
    result.skippedRows++;
    result.warnings.push(`Row ${rowNumber}: Translation '${translationKey}' for '${languageCode}' already exists, skipped`);
    return;
  }

  // Mock successful import
  result.successfulImports++;
}

async function processAppKeyRow(row: any, environment: string, region: string, overwriteExisting: boolean, userId: string, rowNumber: number, result: any) {
  // Mock app key processing
  const appName = row["Application Name"];
  const keyName = row["Key Name"];
  
  // Check if app key already exists
  const exists = Math.random() > 0.95; // Mock 5% chance of existing
  
  if (exists && !overwriteExisting) {
    result.skippedRows++;
    result.warnings.push(`Row ${rowNumber}: App key '${keyName}' for '${appName}' already exists, skipped`);
    return;
  }

  // Mock successful import
  result.successfulImports++;
}

// Mock audit logging function
async function logImportAction(
  userId: string, 
  importType: string, 
  environment: string, 
  region: string, 
  fileName: string, 
  result: any
) {
  // In production, this would log to the audit system
  console.log(`Import action logged: User ${userId} imported ${importType} data`, {
    environment,
    region,
    fileName,
    result,
    timestamp: new Date().toISOString(),
  });
}
