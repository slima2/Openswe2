"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCemexAuth } from "@/hooks/useCemexAuth";
import {
  Home,
  Settings,
  Languages,
  Key,
  FileText,
  HelpCircle,
  LogOut,
  Database,
  Shield,
} from "lucide-react";

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string;
}

/**
 * CEMEX Console Navigation Component
 * Provides role-based navigation menu for CEMEX Configuration Console
 */
export function CemexNavigation() {
  const pathname = usePathname();
  const { user, logout, hasRole, canImportExport, canPerformCRUD, hasReadAccess } = useCemexAuth();

  // Navigation items with role-based access control
  const navigationItems: NavigationItem[] = [
    {
      id: "home",
      label: "Home",
      href: "/cemex",
      icon: Home,
      roles: ["Console Admin", "Technical", "Guest"],
    },
    {
      id: "parameters",
      label: "Parameters",
      href: "/cemex/parameters",
      icon: Settings,
      roles: ["Console Admin", "Technical", "Guest"],
      badge: canImportExport() ? "Admin" : undefined,
    },
    {
      id: "translations",
      label: "Translations",
      href: "/cemex/translations",
      icon: Languages,
      roles: ["Console Admin", "Technical", "Guest"],
    },
    {
      id: "maintenance-translations",
      label: "Maintenance Windows",
      href: "/cemex/maintenance-translations",
      icon: Database,
      roles: ["Console Admin", "Technical", "Guest"],
    },
    {
      id: "apps-keys",
      label: "Apps & Keys",
      href: "/cemex/apps-keys",
      icon: Key,
      roles: ["Console Admin", "Technical", "Guest"],
    },
    {
      id: "audit-log",
      label: "Audit Log",
      href: "/cemex/audit-log",
      icon: Shield,
      roles: ["Console Admin", "Technical", "Guest"],
    },
  ];

  // Filter navigation items based on user role
  const visibleItems = navigationItems.filter((item) =>
    hasRole(item.roles as any)
  );

  const handleLogout = async () => {
    await logout();
    window.location.href = "/cemex/login";
  };

  return (
    <nav className="flex h-full flex-col">
      {/* Logo/Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">CEMEX Console</h2>
            <p className="text-xs text-muted-foreground">Configuration Management</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* User Info */}
      <div className="p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.cemexRole}</p>
            </div>
          </div>
          <div className="mt-2 flex gap-1">
            <Badge variant="secondary" className="text-xs">
              {user?.region}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {user?.environment}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation Menu */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link key={item.id} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Actions
          </p>
          
          {canImportExport() && (
            <>
              <Link href="/cemex/export">
                <Button variant="ghost" className="w-full justify-start gap-3 h-9">
                  <FileText className="h-4 w-4" />
                  <span>Env. Export</span>
                  <Badge variant="destructive" className="text-xs">
                    Admin
                  </Badge>
                </Button>
              </Link>
              <Link href="/cemex/import">
                <Button variant="ghost" className="w-full justify-start gap-3 h-9">
                  <Database className="h-4 w-4" />
                  <span>Env. Import</span>
                  <Badge variant="destructive" className="text-xs">
                    Admin
                  </Badge>
                </Button>
              </Link>
            </>
          )}

          <Link href="/cemex/help">
            <Button variant="ghost" className="w-full justify-start gap-3 h-9">
              <HelpCircle className="h-4 w-4" />
              <span>How to?</span>
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Footer Actions */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </nav>
  );
}
