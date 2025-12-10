import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { useCemexAuth } from "@/hooks/useCemexAuth";
import { CemexMessageSystem } from "./CemexMessageSystem";

interface ExcelImportExportProps {
  module: "parameters" | "translations" | "appkeys";
  onImportComplete?: () => void;
}

interface ImportResult {
  totalRows: number;
  successfulImports: number;
  skippedRows: number;
  errors: string[];
  warnings: string[];
}

export function ExcelImportExport({ module, onImportComplete }: ExcelImportExportProps) {
  const { user, hasImportExportAccess } = useCemexAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning" | "info"; text: string } | null>(null);

  // Import form state
  const [importEnvironment, setImportEnvironment] = useState<string>("");
  const [importRegion, setImportRegion] = useState<string>("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export form state
  const [exportEnvironment, setExportEnvironment] = useState<string>("");
  const [exportRegion, setExportRegion] = useState<string>("");
  const [exportServiceId, setExportServiceId] = useState<string>("");

  const moduleLabels = {
    parameters: "Configuration Parameters",
    translations: "Translations",
    appkeys: "Application Keys",
  };

  const environments = [
    { value: "QA", label: "QA - Quality Assurance", hierarchy: 1 },
    { value: "PROD", label: "PROD - Production", hierarchy: 2 },
    { value: "DEV", label: "DEV - Development", hierarchy: 3 },
    { value: "DEV2", label: "DEV2 - Development 2", hierarchy: 3 },
    { value: "QA2", label: "QA2 - Quality Assurance 2", hierarchy: 3 },
    { value: "PRE-PROD", label: "PRE-PROD - Pre-Production", hierarchy: 3 },
    { value: "DEMO", label: "DEMO - Demonstration", hierarchy: 3 },
  ];

  const regions = [
    { value: "AME", label: "AME - Americas" },
    { value: "EUR", label: "EUR - Europe" },
  ];

  // Check if user has import/export access
  if (!hasImportExportAccess()) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Import/Export
          </CardTitle>
          <CardDescription>
            Import and export {moduleLabels[module].toLowerCase()} data using Excel files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Only Console Admin users can import/export data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleExport = async () => {
    if (!exportEnvironment) {
      setMessage({ type: "error", text: "Please select an environment for export" });
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        type: module,
        environment: exportEnvironment,
        ...(exportRegion && { region: exportRegion }),
        ...(exportServiceId && { serviceId: exportServiceId }),
      });

      const response = await fetch(`/api/cemex/export?${params}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("cemex_token")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Export failed");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
        `CEMEX_${module.toUpperCase()}_${exportEnvironment}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ 
        type: "success", 
        text: `${moduleLabels[module]} data exported successfully` 
      });

    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Export failed" 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        setMessage({ type: "error", text: "Please select an Excel file (.xlsx or .xls)" });
        return;
      }

      // Validate file naming convention
      const expectedPrefix = `CEMEX_${module.toUpperCase()}`;
      if (!file.name.toUpperCase().startsWith(expectedPrefix)) {
        setMessage({ 
          type: "error", 
          text: `File name must start with ${expectedPrefix}` 
        });
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setMessage({ type: "error", text: "File size must be less than 10MB" });
        return;
      }

      setSelectedFile(file);
      setMessage(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !importEnvironment) {
      setMessage({ type: "error", text: "Please select a file and environment" });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setShowImportDialog(false);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", module);
      formData.append("environment", importEnvironment);
      if (importRegion) formData.append("region", importRegion);
      formData.append("overwriteExisting", overwriteExisting.toString());

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/cemex/import", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("cemex_token")}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Import failed");
      }

      const result = await response.json();
      setImportResult(result.result);
      setShowResultDialog(true);

      if (onImportComplete) {
        onImportComplete();
      }

      // Reset form
      setSelectedFile(null);
      setImportEnvironment("");
      setImportRegion("");
      setOverwriteExisting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Import failed" 
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const resetImportForm = () => {
    setSelectedFile(null);
    setImportEnvironment("");
    setImportRegion("");
    setOverwriteExisting(false);
    setMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Import/Export
          </CardTitle>
          <CardDescription>
            Import and export {moduleLabels[module].toLowerCase()} data using Excel files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <h3 className="font-semibold">Export Data</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Environment *</Label>
                <Select value={exportEnvironment} onValueChange={setExportEnvironment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((env) => (
                      <SelectItem key={env.value} value={env.value}>
                        <div className="flex items-center gap-2">
                          <span>{env.label}</span>
                          {env.hierarchy === 2 && (
                            <Badge variant="destructive" className="text-xs">PROD</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={exportRegion} onValueChange={setExportRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="All regions..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {module === "parameters" && (
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select value={exportServiceId} onValueChange={setExportServiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All services..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All services</SelectItem>
                      <SelectItem value="service-1">User Authentication Service</SelectItem>
                      <SelectItem value="service-2">Payment Processing Service</SelectItem>
                      <SelectItem value="service-3">Notification Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button 
              onClick={handleExport} 
              disabled={isExporting || !exportEnvironment}
              className="w-full md:w-auto"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Import Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <h3 className="font-semibold">Import Data</h3>
            </div>

            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Import from Excel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Import {moduleLabels[module]}</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file to import {moduleLabels[module].toLowerCase()} data
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* File Selection */}
                  <div className="space-y-2">
                    <Label>Excel File *</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="w-full p-2 border border-input rounded-md"
                    />
                    {selectedFile && (
                      <div className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                  </div>

                  {/* Environment Selection */}
                  <div className="space-y-2">
                    <Label>Target Environment *</Label>
                    <Select value={importEnvironment} onValueChange={setImportEnvironment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment..." />
                      </SelectTrigger>
                      <SelectContent>
                        {environments.map((env) => (
                          <SelectItem key={env.value} value={env.value}>
                            <div className="flex items-center gap-2">
                              <span>{env.label}</span>
                              {env.hierarchy === 2 && (
                                <Badge variant="destructive" className="text-xs">PROD</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {importEnvironment === "PROD" && (
                      <div className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Production environment - changes affect live systems
                      </div>
                    )}
                  </div>

                  {/* Region Selection */}
                  <div className="space-y-2">
                    <Label>Target Region</Label>
                    <Select value={importRegion} onValueChange={setImportRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Use file region</SelectItem>
                        {regions.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Overwrite Option */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="overwrite"
                      checked={overwriteExisting}
                      onCheckedChange={setOverwriteExisting}
                    />
                    <Label htmlFor="overwrite">Overwrite existing records</Label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleImport}
                      disabled={!selectedFile || !importEnvironment || isImporting}
                      className="flex-1"
                    >
                      {isImporting ? "Importing..." : "Import Data"}
                    </Button>
                    <Button variant="outline" onClick={resetImportForm}>
                      Reset
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Import Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing data...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Complete
            </DialogTitle>
            <DialogDescription>
              Import operation completed for {moduleLabels[module].toLowerCase()}
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.successfulImports}
                  </div>
                  <div className="text-xs text-muted-foreground">Imported</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.skippedRows}
                  </div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.errors.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>

              <Separator />

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Errors</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">Warnings</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => setShowResultDialog(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message System */}
      <CemexMessageSystem
        message={message}
        onDismiss={() => setMessage(null)}
      />
    </>
  );
}
