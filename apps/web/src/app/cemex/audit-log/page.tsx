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
  Shield,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  User,
  Activity,
  FileText,
  Eye,
  AlertCircle,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  module: string;
  tableName: string;
  recordId: string;
  oldValues: any;
  newValues: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// Mock data for demonstration
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "1",
    userId: "admin_1",
    username: "admin.user",
    action: "CREATE",
    module: "parameters",
    tableName: "configuration_parameters",
    recordId: "param_123",
    oldValues: null,
    newValues: {
      paramKey: "MAX_LOGIN_ATTEMPTS",
      paramValue: "5",
      environment: "PROD",
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    userId: "tech_1",
    username: "tech.user",
    action: "UPDATE",
    module: "parameters",
    tableName: "configuration_parameters",
    recordId: "param_124",
    oldValues: {
      paramValue: "3600",
    },
    newValues: {
      paramValue: "7200",
    },
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: "2024-01-15T09:15:00Z",
  },
  {
    id: "3",
    userId: "admin_1",
    username: "admin.user",
    action: "DELETE",
    module: "translations",
    tableName: "translations",
    recordId: "trans_456",
    oldValues: {
      translationKey: "old.message.key",
      translationValue: "Old message value",
      languageCode: "en",
    },
    newValues: null,
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: "2024-01-14T16:45:00Z",
  },
  {
    id: "4",
    userId: "admin_1",
    username: "admin.user",
    action: "IMPORT",
    module: "parameters",
    tableName: "configuration_parameters",
    recordId: "batch_789",
    oldValues: null,
    newValues: {
      importedRecords: 25,
      environment: "QA",
      fileName: "Env_Parameters_US_AME_QA_20240114.xlsx",
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "5",
    userId: "tech_1",
    username: "tech.user",
    action: "CREATE",
    module: "apps-keys",
    tableName: "app_keys",
    recordId: "key_321",
    oldValues: null,
    newValues: {
      appName: "CEMEX API Gateway",
      keyName: "API_GATEWAY_KEY",
      environment: "QA",
    },
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: "2024-01-13T11:30:00Z",
  },
];

const modules = ["all", "parameters", "translations", "apps-keys", "maintenance-windows", "auth"];
const actions = ["all", "CREATE", "UPDATE", "DELETE", "IMPORT", "EXPORT", "LOGIN", "LOGOUT"];

/**
 * CEMEX Audit Log Page
 * Views system audit logs and change history with filtering and search
 */
export default function CemexAuditLogPage() {
  const { user, hasReadAccess } = useCemexAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7days");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Get unique users for filter
  const users = Array.from(new Set(auditLogs.map(log => log.username)));

  // Filter audit logs based on search and filters
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recordId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = selectedModule === "all" || log.module === selectedModule;
    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    const matchesUser = selectedUser === "all" || log.username === selectedUser;
    
    // Date range filtering (simplified for demo)
    const logDate = new Date(log.createdAt);
    const now = new Date();
    const daysAgo = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    const matchesDate = logDate >= cutoffDate;
    
    return matchesSearch && matchesModule && matchesAction && matchesUser && matchesDate;
  });

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    console.log("Export audit logs");
  };

  const toggleEntryExpansion = (id: string) => {
    setExpandedEntry(expandedEntry === id ? null : id);
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "CREATE": return "default";
      case "UPDATE": return "secondary";
      case "DELETE": return "destructive";
      case "IMPORT":
      case "EXPORT": return "outline";
      default: return "outline";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return "➕";
      case "UPDATE": return "✏️";
      case "DELETE": return "🗑️";
      case "IMPORT": return "📥";
      case "EXPORT": return "📤";
      case "LOGIN": return "🔐";
      case "LOGOUT": return "🚪";
      default: return "📝";
    }
  };

  return (
    <CemexLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Audit Log
            </h1>
            <p className="text-muted-foreground">
              View system audit logs and change history for compliance and troubleshooting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {filteredAuditLogs.length} entries
            </Badge>
            <Badge variant="secondary">
              Last {dateRange === "7days" ? "7" : dateRange === "30days" ? "30" : "90"} days
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
                  {hasReadAccess() && "View access to audit logs for compliance and monitoring"}
                </p>
              </div>
              <Badge variant="outline">View Only</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            <CardDescription>
              Filter and search audit log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Logs</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Module Filter */}
              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module} value={module}>
                        {module === "all" ? "All Modules" : module.charAt(0).toUpperCase() + module.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Filter */}
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action === "all" ? "All Actions" : action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Filter */}
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((username) => (
                      <SelectItem key={username} value={username}>
                        {username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{filteredAuditLogs.length}</div>
                  <div className="text-sm text-muted-foreground">Total Entries</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{modules.length - 1}</div>
                  <div className="text-sm text-muted-foreground">Modules</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {dateRange === "7days" ? "7" : dateRange === "30days" ? "30" : "90"}
                  </div>
                  <div className="text-sm text-muted-foreground">Days Range</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audit Log Entries</CardTitle>
            <CardDescription>
              Detailed audit trail of all system activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAuditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Audit Logs Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || selectedModule !== "all" || selectedAction !== "all" || selectedUser !== "all"
                      ? "Try adjusting your search criteria or filters."
                      : "No audit log entries are available for the selected date range."}
                  </p>
                </div>
              ) : (
                filteredAuditLogs.map((log) => (
                  <Card key={log.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getActionIcon(log.action)}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                                  {log.action}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {log.module}
                                </Badge>
                                <span className="text-sm font-medium">{log.username}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(log.createdAt).toLocaleString()} • {log.ipAddress}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEntryExpansion(log.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Table:</span>
                            <p className="font-mono">{log.tableName}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Record ID:</span>
                            <p className="font-mono">{log.recordId}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">User Agent:</span>
                            <p className="truncate">{log.userAgent.split(' ')[0]}</p>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedEntry === log.id && (
                          <div className="space-y-3 pt-3 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Old Values */}
                              {log.oldValues && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Previous Values</h4>
                                  <pre className="bg-red-50 dark:bg-red-950 p-3 rounded text-xs overflow-auto">
                                    {JSON.stringify(log.oldValues, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {/* New Values */}
                              {log.newValues && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2">New Values</h4>
                                  <pre className="bg-green-50 dark:bg-green-950 p-3 rounded text-xs overflow-auto">
                                    {JSON.stringify(log.newValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {/* Full User Agent */}
                            <div>
                              <h4 className="font-medium text-sm mb-2">Full User Agent</h4>
                              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                {log.userAgent}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance & Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Audit Log Retention</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Audit logs are retained for 7 years</li>
                  <li>• All user actions are automatically logged</li>
                  <li>• Logs include before/after values for changes</li>
                  <li>• IP addresses and user agents are recorded</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Compliance Features</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• SOX compliance for financial data changes</li>
                  <li>• GDPR compliance for user data handling</li>
                  <li>• Export capabilities for audit reports</li>
                  <li>• Real-time monitoring and alerting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CemexLayout>
  );
}
