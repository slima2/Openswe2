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

// Mock data for demonstration
const mockParameters: ConfigurationParameter[] = [
  {
    id: "1",
    serviceId: "service-1",
    serviceName: "User Authentication Service",
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
    id: "2",
    serviceId: "service-1",
    serviceName: "User Authentication Service",
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
    id: "3",
    serviceId: "service-2",
    serviceName: "Email Notification Service",
    paramKey: "SMTP_HOST",
    paramValue: "smtp.cemex.com",
    paramType: "STRING",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
];

/**
 * CEMEX Parameters Configuration Page
 * Manages service configuration parameters with CRUD operations
 */
export default function CemexParametersPage() {
  const { user, canImportExport, canPerformCRUD, hasReadAccess } = useCemexAuth();
  const [parameters, setParameters] = useState<ConfigurationParameter[]>(mockParameters);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Get unique services for filter
  const services = Array.from(new Set(parameters.map(p => p.serviceName)));

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
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleAddParameter = () => {
    // TODO: Open add parameter dialog
    console.log("Add parameter");
  };

  const handleEditParameter = (id: string) => {
    // TODO: Open edit parameter dialog
    console.log("Edit parameter:", id);
  };

  const handleDeleteParameter = (id: string) => {
    // TODO: Open delete confirmation dialog
    console.log("Delete parameter:", id);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export parameters");
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log("Import parameters");
  };

  return (
    <CemexLayout>
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
                                onClick={() => handleEditParameter(param.id)}
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
      </div>
    </CemexLayout>
  );
}

