"use client";

import React, { useState } from "react";
import { CemexLayout } from "@/components/cemex/CemexLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCemexAuth } from "@/hooks/useCemexAuth";
import {
  Key,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  Shield,
} from "lucide-react";

interface AppKey {
  id: string;
  appName: string;
  keyName: string;
  keyValue: string;
  environment: string;
  region: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for demonstration
const mockAppKeys: AppKey[] = [
  {
    id: "1",
    appName: "CEMEX Authentication Service",
    keyName: "JWT_SECRET_KEY",
    keyValue: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    appName: "CEMEX Authentication Service",
    keyName: "ENCRYPTION_KEY",
    keyValue: "AES256-GCM-SECRET-KEY-2024",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "3",
    appName: "CEMEX Email Service",
    keyName: "SMTP_API_KEY",
    keyValue: "smtp_key_prod_2024_cemex_secure",
    environment: "PROD",
    region: "AME",
    isActive: true,
    createdBy: "tech.user",
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "4",
    appName: "CEMEX Database Service",
    keyName: "DB_CONNECTION_STRING",
    keyValue: "postgresql://user:pass@db.cemex.com:5432/cemex_prod",
    environment: "PROD",
    region: "EUR",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-12T16:45:00Z",
    updatedAt: "2024-01-12T16:45:00Z",
  },
  {
    id: "5",
    appName: "CEMEX API Gateway",
    keyName: "API_GATEWAY_KEY",
    keyValue: "gw_key_qa_2024_testing_env",
    environment: "QA",
    region: "AME",
    isActive: true,
    createdBy: "tech.user",
    createdAt: "2024-01-11T11:30:00Z",
    updatedAt: "2024-01-11T11:30:00Z",
  },
];

/**
 * CEMEX Apps & Keys Management Page
 * Manages application keys and service configurations with CRUD operations
 */
export default function CemexAppsKeysPage() {
  const { user, canPerformCRUD, hasReadAccess } = useCemexAuth();
  const [appKeys, setAppKeys] = useState<AppKey[]>(mockAppKeys);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<string>("all");
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("all");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Get unique applications for filter
  const applications = Array.from(new Set(appKeys.map(key => key.appName)));

  // Filter app keys based on search and filters
  const filteredAppKeys = appKeys.filter(appKey => {
    const matchesSearch = 
      appKey.appName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appKey.keyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesApp = selectedApp === "all" || appKey.appName === selectedApp;
    const matchesEnvironment = selectedEnvironment === "all" || appKey.environment === selectedEnvironment;
    
    return matchesSearch && matchesApp && matchesEnvironment;
  });

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleAddAppKey = () => {
    console.log("Add app key");
  };

  const handleEditAppKey = (id: string) => {
    console.log("Edit app key:", id);
  };

  const handleDeleteAppKey = (id: string) => {
    console.log("Delete app key:", id);
  };

  const toggleKeyVisibility = (id: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(id)) {
      newVisibleKeys.delete(id);
    } else {
      newVisibleKeys.add(id);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "*".repeat(key.length);
    return key.substring(0, 4) + "*".repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <CemexLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Key className="h-8 w-8" />
              Apps & Keys Management
            </h1>
            <p className="text-muted-foreground">
              Manage application keys and service configurations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {filteredAppKeys.length} keys
            </Badge>
            <Badge variant="secondary">
              {user?.environment} Environment
            </Badge>
          </div>
        </div>

        {/* Security Warning */}
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Security Notice</h3>
                <p className="text-sm text-destructive/80">
                  Application keys contain sensitive information. Handle with extreme care and follow security protocols.
                  Keys are masked by default and should only be revealed when necessary.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  {canPerformCRUD() && "CRUD operations available for application key management"}
                  {hasReadAccess() && !canPerformCRUD() && "Read-only access to view application keys"}
                </p>
              </div>
              {canPerformCRUD() && (
                <Badge variant="secondary">CRUD Access</Badge>
              )}
              {hasReadAccess() && !canPerformCRUD() && (
                <Badge variant="outline">Read Only</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            <CardDescription>
              Filter and search application keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Keys</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by app or key name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Application Filter */}
              <div className="space-y-2">
                <Label>Application</Label>
                <Select value={selectedApp} onValueChange={setSelectedApp}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Applications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    {applications.map((app) => (
                      <SelectItem key={app} value={app}>
                        {app}
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
                      onClick={handleAddAppKey}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Keys List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Keys</CardTitle>
            <CardDescription>
              Manage application keys and service configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAppKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Application Keys Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || selectedApp !== "all" || selectedEnvironment !== "all"
                      ? "Try adjusting your search criteria or filters."
                      : "No application keys are currently available."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAppKeys.map((appKey) => (
                    <Card key={appKey.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{appKey.keyName}</h4>
                                <Badge 
                                  variant={appKey.environment === "PROD" ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {appKey.environment}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {appKey.region}
                                </Badge>
                                {appKey.isActive && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-600">Active</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{appKey.appName}</p>
                            </div>
                            
                            {canPerformCRUD() && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditAppKey(appKey.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteAppKey(appKey.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Key Value Section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Key Value</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleKeyVisibility(appKey.id)}
                                >
                                  {visibleKeys.has(appKey.id) ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(appKey.keyValue)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="bg-muted p-3 rounded font-mono text-sm">
                              {visibleKeys.has(appKey.id) ? appKey.keyValue : maskKey(appKey.keyValue)}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-2 border-t">
                            <div>
                              <span className="text-muted-foreground">Created by:</span>
                              <p className="font-medium">{appKey.createdBy}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Created:</span>
                              <p>{new Date(appKey.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Last Updated:</span>
                              <p>{new Date(appKey.updatedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Key Management Best Practices</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Use strong, unique keys for each application</li>
                  <li>• Rotate keys regularly (recommended: every 90 days)</li>
                  <li>• Never share keys through insecure channels</li>
                  <li>• Monitor key usage and access patterns</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Environment Separation</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Use different keys for each environment</li>
                  <li>• Production keys require additional approval</li>
                  <li>• Test keys should not work in production</li>
                  <li>• Audit all key access and modifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CemexLayout>
  );
}
