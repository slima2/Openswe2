"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCemexAuth } from "@/hooks/useCemexAuth";
import { Server, AlertTriangle, Shield, TestTube, Wrench } from "lucide-react";

interface EnvironmentSelectorProps {
  className?: string;
  onEnvironmentChange?: (environment: string) => void;
  disabled?: boolean;
  showDescription?: boolean;
  showHierarchy?: boolean;
}

interface EnvironmentInfo {
  code: string;
  name: string;
  description: string;
  level: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  riskLevel: "low" | "medium" | "high";
  features: string[];
}

const ENVIRONMENTS: EnvironmentInfo[] = [
  {
    code: "QA",
    name: "Quality Assurance",
    description: "Testing environment for quality validation before production deployment",
    level: 1,
    color: "bg-green-500",
    icon: TestTube,
    riskLevel: "low",
    features: ["Safe Testing", "Data Validation", "Import/Export Testing"],
  },
  {
    code: "PROD",
    name: "Production",
    description: "Live production environment - all changes affect real operations",
    level: 2,
    color: "bg-red-500",
    icon: Server,
    riskLevel: "high",
    features: ["Live Data", "Real Operations", "High Security"],
  },
  {
    code: "DEMO",
    name: "Demonstration",
    description: "Demo environment for presentations and training",
    level: 3,
    color: "bg-blue-500",
    icon: Shield,
    riskLevel: "low",
    features: ["Demo Data", "Training Safe", "Presentation Ready"],
  },
  {
    code: "DEV",
    name: "Development",
    description: "Development environment for feature development and testing",
    level: 3,
    color: "bg-purple-500",
    icon: Wrench,
    riskLevel: "low",
    features: ["Development", "Feature Testing", "Code Changes"],
  },
  {
    code: "DEV2",
    name: "Development 2",
    description: "Secondary development environment for parallel development",
    level: 3,
    color: "bg-purple-400",
    icon: Wrench,
    riskLevel: "low",
    features: ["Parallel Dev", "Feature Testing", "Code Changes"],
  },
  {
    code: "QA2",
    name: "Quality Assurance 2",
    description: "Secondary QA environment for additional testing scenarios",
    level: 3,
    color: "bg-green-400",
    icon: TestTube,
    riskLevel: "low",
    features: ["Extended Testing", "Scenario Validation", "Quality Control"],
  },
  {
    code: "PRE-PROD",
    name: "Pre-Production",
    description: "Pre-production environment for final validation before production",
    level: 3,
    color: "bg-orange-500",
    icon: Shield,
    riskLevel: "medium",
    features: ["Final Testing", "Production Mirror", "Go-Live Prep"],
  },
];

/**
 * CEMEX Environment Selector Component
 * Allows users to select and switch between CEMEX environments
 * Displays environment hierarchy, risk levels, and import/export validation
 */
export function EnvironmentSelector({
  className,
  onEnvironmentChange,
  disabled = false,
  showDescription = true,
  showHierarchy = true,
}: EnvironmentSelectorProps) {
  const { user, canImportExport } = useCemexAuth();
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(user?.environment || "");

  const handleEnvironmentChange = (environmentCode: string) => {
    setSelectedEnvironment(environmentCode);
    onEnvironmentChange?.(environmentCode);
  };

  const getCurrentEnvironmentInfo = () => {
    return ENVIRONMENTS.find(env => env.code === (selectedEnvironment || user?.environment));
  };

  const getEnvironmentsByLevel = () => {
    const grouped = ENVIRONMENTS.reduce((acc, env) => {
      if (!acc[env.level]) acc[env.level] = [];
      acc[env.level].push(env);
      return acc;
    }, {} as Record<number, EnvironmentInfo[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, envs]) => ({ level: Number(level), environments: envs }));
  };

  const currentEnvironment = getCurrentEnvironmentInfo();
  const environmentLevels = getEnvironmentsByLevel();

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Environment Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5" />
            Environment Selection
          </CardTitle>
          {showDescription && (
            <CardDescription>
              Select the target environment for configuration operations. Environment hierarchy affects import/export permissions.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current User Environment Info */}
            {user?.environment && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Your current environment:</span>
                <Badge variant="secondary" className="font-medium">
                  {user.environment} - {ENVIRONMENTS.find(e => e.code === user.environment)?.name}
                </Badge>
              </div>
            )}

            {/* Environment Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Environment</label>
              <Select
                value={selectedEnvironment}
                onValueChange={handleEnvironmentChange}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an environment..." />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENTS.map((env) => {
                    const Icon = env.icon;
                    return (
                      <SelectItem key={env.code} value={env.code}>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", env.color)} />
                          <Icon className="h-3 w-3" />
                          <span className="font-medium">{env.code}</span>
                          <span className="text-muted-foreground">- {env.name}</span>
                          <Badge 
                            variant={getRiskBadgeVariant(env.riskLevel)} 
                            className="text-xs ml-auto"
                          >
                            Level {env.level}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Production Environment Warning */}
            {selectedEnvironment === "PROD" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Production Environment Warning:</strong> You are selecting the PRODUCTION environment. 
                  All changes will directly impact live systems. Please exercise extreme caution.
                </AlertDescription>
              </Alert>
            )}

            {/* Import/Export Hierarchy Validation */}
            {canImportExport() && selectedEnvironment && user?.environment && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">Import/Export Validation</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Environment hierarchy rule: File environment level ≤ Current environment level
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs">Current: {user.environment} (Level {ENVIRONMENTS.find(e => e.code === user.environment)?.level})</span>
                      <span className="text-xs">→</span>
                      <span className="text-xs">Selected: {selectedEnvironment} (Level {ENVIRONMENTS.find(e => e.code === selectedEnvironment)?.level})</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Environment Hierarchy Display */}
      {showHierarchy && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Environment Hierarchy</CardTitle>
            <CardDescription>
              Understanding the environment levels for import/export operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {environmentLevels.map(({ level, environments }) => (
                <div key={level} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-medium">
                      Level {level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {level === 1 && "Highest Security - Limited Import Sources"}
                      {level === 2 && "Production Level - Restricted Access"}
                      {level === 3 && "Development Level - Flexible Import/Export"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-4">
                    {environments.map((env) => {
                      const Icon = env.icon;
                      const isSelected = selectedEnvironment === env.code;
                      const isCurrent = user?.environment === env.code;
                      
                      return (
                        <div
                          key={env.code}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            isSelected && "border-primary bg-primary/5",
                            isCurrent && "border-secondary bg-secondary/5"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn("h-3 w-3 rounded-full", env.color)} />
                            <Icon className="h-4 w-4" />
                            <span className="font-medium text-sm">{env.code}</span>
                            <Badge 
                              variant={getRiskBadgeVariant(env.riskLevel)} 
                              className="text-xs ml-auto"
                            >
                              {env.riskLevel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{env.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {env.features.slice(0, 2).map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          {(isSelected || isCurrent) && (
                            <div className="mt-2 flex gap-1">
                              {isSelected && (
                                <Badge variant="default" className="text-xs">Selected</Badge>
                              )}
                              {isCurrent && (
                                <Badge variant="secondary" className="text-xs">Current</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Environment Details */}
      {currentEnvironment && showDescription && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <div className={cn("h-4 w-4 rounded-full", currentEnvironment.color)} />
              <currentEnvironment.icon className="h-4 w-4" />
              {currentEnvironment.name} ({currentEnvironment.code})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {currentEnvironment.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Hierarchy Level:</span>
                  <p className="text-muted-foreground">Level {currentEnvironment.level}</p>
                </div>
                
                <div>
                  <span className="font-medium">Risk Level:</span>
                  <Badge variant={getRiskBadgeVariant(currentEnvironment.riskLevel)} className="text-xs ml-1">
                    {currentEnvironment.riskLevel.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <span className="font-medium">Import/Export:</span>
                  <p className="text-muted-foreground">
                    {canImportExport() ? "Allowed" : "Read Only"}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-medium">Features:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentEnvironment.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Environment Status */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Environment Active</span>
                </div>
                {user?.environment === currentEnvironment.code && (
                  <Badge variant="secondary" className="text-xs">
                    Your Environment
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
