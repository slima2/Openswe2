"use client";

import React, { useState, useEffect } from "react";
import { CemexLayout } from "@/components/cemex/CemexLayout";
import { ParameterForm } from "@/components/cemex/ParameterForm";
import { CemexMessageSystem, useCemexMessages } from "@/components/cemex/CemexMessageSystem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCemexAuth } from "@/hooks/useCemexAuth";
import {
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface ConfigurationParameter {
  id: string;
  serviceId: string;
  serviceName: string;
  paramKey: string;
  paramValue: string;
  paramType: string;
  environment: string;
  region: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  id: string;
  serviceName: string;
  serviceCode: string;
}

/**
 * CEMEX Parameters Configuration Page
 * Manages service configuration parameters with CRUD operations
 */
export default function CemexParametersPage() {
  const { user, canImportExport, canPerformCRUD, hasReadAccess } = useCemexAuth();
  const messages = useCemexMessages();
  
  // State management
  const [parameters, setParameters] = useState<ConfigurationParameter[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<ConfigurationParameter | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [parameterToDelete, setParameterToDelete] = useState<string | null>(null);

  // Load parameters and services on mount
  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cemex/parameters", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to load parameters");
      }
      
      const data = await response.json();
      if (data.success) {
        setParameters(data.data.parameters || []);
        setServices(data.data.services || []);
      } else {
        messages.showError(data.error || "Failed to load parameters");
      }
    } catch (error) {
      console.error("Error loading parameters:", error);
      messages.showError("Failed to load configuration parameters");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter parameters based on search and filters
  const filteredParameters = parameters.filter(param => {
    const matchesSearch = 
      param.paramKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      param.paramValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      param.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = selectedService === "all" || param.serviceName === selectedService;
    const matchesEnvironment = selectedEnvironment === "all" || param.environment === selectedEnvironment;
    
    return matchesSearch && matchesService && matchesEnvironment;
  });

  const handleRefresh = () => {
    loadParameters();
  };

  const handleAddParameter = () => {
    setEditingParameter(null);
    setIsFormOpen(true);
  };

  const handleEditParameter = (parameter: ConfigurationParameter) => {
    setEditingParameter(parameter);
    setIsFormOpen(true);
  };

  const handleDeleteParameter = (id: string) => {
    setParameterToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!parameterToDelete) return;

    try {
      const response = await fetch(`/api/cemex/parameters/${parameterToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      
      if (data.success) {
        messages.showParameterDeleted();
        setParameters(prev => prev.filter(p => p.id !== parameterToDelete));
      } else {
        messages.showError(data.error || "Failed to delete parameter");
      }
    } catch (error) {
      console.error("Error deleting parameter:", error);
      messages.showError("Failed to delete parameter");
    } finally {
      setDeleteConfirmOpen(false);
      setParameterToDelete(null);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      const url = editingParameter 
        ? "/api/cemex/parameters" 
        : "/api/cemex/parameters";
      
      const method = editingParameter ? "PUT" : "POST";
      const payload = editingParameter 
        ? { ...formData, id: editingParameter.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        messages.showParameterSaved();
        setIsFormOpen(false);
        setEditingParameter(null);
        loadParameters(); // Reload to get updated data
      } else {
        if (data.code === "DUPLICATE_PARAMETER") {
          messages.showDuplicateError();
        } else if (data.code === "VALIDATION_ERROR") {
          messages.showValidationError(data.error);
        } else {
          messages.showError(data.error || "Failed to save parameter");
        }
        throw new Error(data.error);
      }
    } catch (error) {
      // Error handling is done above, just re-throw for form component
      throw error;
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality in next task
    messages.showSuccess("Export functionality will be implemented in the next phase");
  };

  const handleImport = () => {
    // TODO: Implement import functionality in next task
    messages.showSuccess("Import functionality will be implemented in the next phase");
  };

  return (
    <CemexLayout>
      <CemexMessageSystem 
        messages={messages.messages} 
        onDismiss={messages.removeMessage} 
      />
      
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Parameters Configuration
            </h1>
            <p className="text-muted-foreground">
              Manage service configuration parameters and settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {filteredParameters.length} parameters
            </Badge>
            <Badge variant="secondary">
              {user?.environment} Environment
            </Badge>
          </div>
        </div>

        {/* Access Level Information */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Access Level: {user?.cemexRole}</h3>
                <p className="text-sm text-muted-foreground">
                  {canImportExport() && "Full access including import/export operations"}
                  {canPerformCRUD() && !canImportExport() && "CRUD operations available, no import/export"}
                  {hasReadAccess() && !canPerformCRUD() && "Read-only access to view parameters"}
                </p>
              </div>
              {canImportExport() && (
                <Badge variant="destructive">Console Admin</Badge>
              )}
              {canPerformCRUD() && !canImportExport() && (
                <Badge variant="secondary">Technical</Badge>
              )}
              {hasReadAccess() && !canPerformCRUD() && (
                <Badge variant="outline">Guest</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            <CardDescription>
              Filter and search configuration parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Parameters</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by key, value, or service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Service Filter */}
              <div className="space-y-2">
                <Label>Service</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Environment Filter */}
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Environments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Environments</SelectItem>
                    <SelectItem value="PROD">Production</SelectItem>
                    <SelectItem value="QA">Quality Assurance</SelectItem>
                    <SelectItem value="DEV">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Label>Actions</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  {canPerformCRUD() && (
                    <Button
                      size="sm"
                      onClick={handleAddParameter}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Actions */}
        {canImportExport() && (
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">Admin Only</Badge>
                Environment Import/Export
              </CardTitle>
              <CardDescription>
                Import and export configuration parameters by environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Env. Export
                </Button>
                <Button variant="outline" onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Env. Import
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parameters Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration Parameters</CardTitle>
            <CardDescription>
              Service configuration parameters and their values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredParameters.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Parameters Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || selectedService !== "all" || selectedEnvironment !== "all"
                      ? "Try adjusting your search criteria or filters."
                      : "No configuration parameters are currently available."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredParameters.map((param) => (
                    <Card key={param.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{param.paramKey}</h4>
                              <Badge variant="outline" className="text-xs">
                                {param.paramType}
                              </Badge>
                              <Badge 
                                variant={param.environment === "PROD" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {param.environment}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {param.region}
                              </Badge>
                              {param.isActive && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-xs text-green-600">Active</span>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Service:</span>
                                <p className="font-medium">{param.serviceName}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Value:</span>
                                <p className="font-mono bg-muted px-2 py-1 rounded text-sm">
                                  {param.paramValue}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Last Updated:</span>
                                <p>{new Date(param.updatedAt).toLocaleDateString()} by {param.createdBy}</p>
                              </div>
                            </div>
                          </div>
                          
                          {canPerformCRUD() && (
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditParameter(param)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteParameter(param.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parameter Management Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Parameter Types</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• STRING: Text values and configurations</li>
                  <li>• INTEGER: Numeric values and counters</li>
                  <li>• BOOLEAN: True/false settings</li>
                  <li>• JSON: Complex configuration objects</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Best Practices</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Use descriptive parameter keys</li>
                  <li>• Test changes in QA before PROD</li>
                  <li>• Document parameter purposes</li>
                  <li>• Regular parameter audits</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parameter Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingParameter ? "Edit Parameter" : "Add New Parameter"}
              </DialogTitle>
              <DialogDescription>
                {editingParameter 
                  ? "Modify the configuration parameter details"
                  : "Create a new configuration parameter for the selected service"
                }
              </DialogDescription>
            </DialogHeader>
            <ParameterForm
              parameter={editingParameter || undefined}
              services={services}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingParameter(null);
              }}
              isLoading={isLoading}
              mode={editingParameter ? "edit" : "create"}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Parameter Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this configuration parameter? This action cannot be undone.
                {parameterToDelete && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>Parameter:</strong> {parameters.find(p => p.id === parameterToDelete)?.paramKey}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Parameter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CemexLayout>
  );
}






