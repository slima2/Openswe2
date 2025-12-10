"use client";

import React from "react";
import { CemexLayout } from "@/components/cemex/CemexLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCemexAuth } from "@/hooks/useCemexAuth";
import Link from "next/link";
import {
  Home,
  Settings,
  Languages,
  Key,
  Shield,
  Database,
  FileText,
  HelpCircle,
  Users,
  Activity,
  Clock,
  AlertCircle,
} from "lucide-react";

interface QuickActionCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string;
  color: string;
}

/**
 * CEMEX Configuration Console Home Dashboard
 * Main landing page with welcome message, quick actions, and system overview
 */
export default function CemexHomePage() {
  const { user, hasRole, canImportExport, canPerformCRUD, hasReadAccess } = useCemexAuth();

  // Quick action cards with role-based filtering
  const quickActions: QuickActionCard[] = [
    {
      id: "parameters",
      title: "Parameters Configuration",
      description: "Manage service parameters and configuration settings",
      href: "/cemex/parameters",
      icon: Settings,
      roles: ["Console Admin", "Technical", "Guest"],
      badge: canImportExport() ? "Admin Access" : canPerformCRUD() ? "CRUD Access" : "Read Only",
      color: "bg-blue-500",
    },
    {
      id: "translations",
      title: "Translations Management",
      description: "Manage internationalization and language translations",
      href: "/cemex/translations",
      icon: Languages,
      roles: ["Console Admin", "Technical", "Guest"],
      badge: canPerformCRUD() ? "CRUD Access" : "Read Only",
      color: "bg-green-500",
    },
    {
      id: "maintenance-translations",
      title: "Maintenance Windows",
      description: "Manage maintenance window translations and scheduling",
      href: "/cemex/maintenance-translations",
      icon: Database,
      roles: ["Console Admin", "Technical", "Guest"],
      badge: canPerformCRUD() ? "CRUD Access" : "Read Only",
      color: "bg-purple-500",
    },
    {
      id: "apps-keys",
      title: "Apps & Keys",
      description: "Manage application keys and service configurations",
      href: "/cemex/apps-keys",
      icon: Key,
      roles: ["Console Admin", "Technical", "Guest"],
      badge: canPerformCRUD() ? "CRUD Access" : "Read Only",
      color: "bg-orange-500",
    },
    {
      id: "audit-log",
      title: "Audit Log",
      description: "View system audit logs and change history",
      href: "/cemex/audit-log",
      icon: Shield,
      roles: ["Console Admin", "Technical", "Guest"],
      badge: "View Only",
      color: "bg-red-500",
    },
  ];

  // Filter actions based on user role
  const visibleActions = quickActions.filter((action) =>
    hasRole(action.roles as any)
  );

  // Admin-only quick actions
  const adminActions = [
    {
      id: "export",
      title: "Environment Export",
      description: "Export configuration data by environment",
      href: "/cemex/export",
      icon: FileText,
      color: "bg-indigo-500",
    },
    {
      id: "import",
      title: "Environment Import",
      description: "Import configuration data with validation",
      href: "/cemex/import",
      icon: Database,
      color: "bg-teal-500",
    },
  ];

  return (
    <CemexLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome to CEMEX Configuration Console
              </h1>
              <p className="text-muted-foreground">
                Centralized configuration management for CEMEX services and applications
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {user?.region} Region
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {user?.environment} Environment
              </Badge>
            </div>
          </div>

          {/* User Role Information */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {user?.name} - {user?.cemexRole}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.department} | {user?.email}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Session Active</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Connected to {user?.region}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
            <Badge variant="outline">
              {visibleActions.length} modules available
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.id} href={action.href}>
                  <Card className="h-full transition-all hover:shadow-md hover:scale-105 cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                          {action.badge && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {action.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Admin-Only Actions */}
        {canImportExport() && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">Admin Operations</h2>
              <Badge variant="destructive" className="text-xs">
                Console Admin Only
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.id} href={action.href}>
                    <Card className="h-full transition-all hover:shadow-md hover:scale-105 cursor-pointer border-destructive/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{action.title}</CardTitle>
                            <Badge variant="destructive" className="text-xs mt-1">
                              Admin Only
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">
                          {action.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Help and Support Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </CardTitle>
            <CardDescription>
              Get help with using the CEMEX Configuration Console
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Documentation</h4>
                <p className="text-sm text-muted-foreground">
                  Access comprehensive guides and documentation for all console features.
                </p>
                <Link href="/cemex/help">
                  <Button variant="outline" size="sm">
                    View Documentation
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Password Recovery</h4>
                <p className="text-sm text-muted-foreground">
                  Reset your CEMEX ID password if you're having login issues.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://shift.cemex.com/5555" target="_blank" rel="noopener noreferrer">
                    Reset Password
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Configuration Service</span>
                <Badge variant="outline" className="text-xs ml-auto">Online</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Translation Service</span>
                <Badge variant="outline" className="text-xs ml-auto">Online</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Audit Service</span>
                <Badge variant="outline" className="text-xs ml-auto">Online</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CemexLayout>
  );
}
