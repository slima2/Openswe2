"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CemexNavigation } from "./CemexNavigation";
import { WarningBanner } from "./WarningBanner";
import { useCemexAuth } from "@/hooks/useCemexAuth";

interface CemexLayoutProps {
  children: React.ReactNode;
  className?: string;
  showNavigation?: boolean;
  showWarningBanner?: boolean;
}

/**
 * CEMEX Console Layout Component
 * Provides the main layout structure for CEMEX Configuration Console
 * Includes navigation, warning banner, and content area
 */
export function CemexLayout({
  children,
  className,
  showNavigation = true,
  showWarningBanner = true,
}: CemexLayoutProps) {
  const { user, isAuthenticated, isLoading } = useCemexAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading CEMEX Console...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Authentication Required
          </h1>
          <p className="text-muted-foreground">
            Please log in with your CEMEX ID to access the Configuration Console.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Warning Banner */}
      {showWarningBanner && <WarningBanner />}

      <div className="flex h-screen">
        {/* Navigation Sidebar */}
        {showNavigation && (
          <aside className="w-64 border-r bg-card shadow-sm">
            <CemexNavigation />
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {/* User Context Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold">CEMEX Configuration Console</h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome, {user?.name} ({user?.cemexRole})
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">
                  {user?.region}
                </span>
                <span className="rounded-md bg-secondary px-2 py-1">
                  {user?.environment}
                </span>
                <span className="font-medium">{user?.username}</span>
              </div>
            </div>

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
