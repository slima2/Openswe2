"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCemexAuth } from "@/hooks/useCemexAuth";
import { AlertTriangle, X, Info, Shield } from "lucide-react";

interface WarningBannerProps {
  className?: string;
  dismissible?: boolean;
}

/**
 * CEMEX Warning Banner Component
 * Displays important warnings, region information, and system notices
 * Persistent during session as per CEMEX requirements
 */
export function WarningBanner({ className, dismissible = false }: WarningBannerProps) {
  const { user } = useCemexAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showRegionMessage, setShowRegionMessage] = useState(true);

  // Region-specific messages
  const getRegionMessage = () => {
    if (!user?.region) return null;

    const messages = {
      AME: {
        title: "Americas Region (AME)",
        description: "You are accessing the CEMEX Configuration Console for the Americas region. All changes will affect AME environment configurations.",
        variant: "default" as const,
        icon: Info,
      },
      EUR: {
        title: "Europe Region (EUR)", 
        description: "You are accessing the CEMEX Configuration Console for the Europe region. All changes will affect EUR environment configurations.",
        variant: "default" as const,
        icon: Info,
      },
    };

    return messages[user.region as keyof typeof messages];
  };

  // Environment-specific warnings
  const getEnvironmentWarning = () => {
    if (!user?.environment) return null;

    const warnings = {
      PROD: {
        title: "Production Environment Warning",
        description: "You are working in the PRODUCTION environment. All changes will directly impact live systems. Please exercise extreme caution.",
        variant: "destructive" as const,
        icon: AlertTriangle,
      },
      QA: {
        title: "QA Environment",
        description: "You are working in the QA environment. Changes here will be tested before production deployment.",
        variant: "default" as const,
        icon: Shield,
      },
    };

    return warnings[user.environment as keyof typeof warnings];
  };

  // Security and compliance notices
  const getSecurityNotices = () => {
    const notices = [];

    // Chrome browser requirement
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (!isChrome) {
      notices.push({
        title: "Browser Compatibility Warning",
        description: "CEMEX Configuration Console is optimized for Google Chrome. Some features may not work correctly in other browsers.",
        variant: "destructive" as const,
        icon: AlertTriangle,
      });
    }

    // VPN/Network requirement
    notices.push({
      title: "Network Security Notice",
      description: "Ensure you are connected to CEMEXNet or VPN for secure access to configuration data.",
      variant: "default" as const,
      icon: Shield,
    });

    return notices;
  };

  const regionMessage = getRegionMessage();
  const environmentWarning = getEnvironmentWarning();
  const securityNotices = getSecurityNotices();

  if (isDismissed && dismissible) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Environment Warning (highest priority) */}
      {environmentWarning && (
        <Alert variant={environmentWarning.variant} className="border-l-4">
          <environmentWarning.icon className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>{environmentWarning.title}:</strong> {environmentWarning.description}
            </div>
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="ml-4 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Region Information (persistent during session) */}
      {regionMessage && showRegionMessage && (
        <Alert variant={regionMessage.variant} className="bg-primary/5 border-primary/20">
          <regionMessage.icon className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <div className="text-primary">
              <strong>{regionMessage.title}:</strong> {regionMessage.description}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs text-primary/70">Session Active</span>
              {!dismissible && (
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Security Notices */}
      {securityNotices.map((notice, index) => (
        <Alert key={index} variant={notice.variant} className="bg-muted/50">
          <notice.icon className="h-4 w-4" />
          <AlertDescription>
            <strong>{notice.title}:</strong> {notice.description}
          </AlertDescription>
        </Alert>
      ))}

      {/* Role-specific Information */}
      {user?.cemexRole && (
        <Alert className="bg-secondary/50 border-secondary">
          <Shield className="h-4 w-4 text-secondary-foreground" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Access Level:</strong> {user.cemexRole} - 
                {user.cemexRole === "Console Admin" && " Full access including import/export operations"}
                {user.cemexRole === "Technical" && " CRUD operations, no import/export"}
                {user.cemexRole === "Guest" && " Read-only access to all modules"}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.username} | {user.department}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Help and Support Information */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <strong>Need Help?</strong> Access the "How to?" section in the navigation menu for detailed guides and documentation.
            </div>
            <div className="text-xs">
              Password recovery: <span className="font-mono">shift.cemex.com/5555</span> option 1
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
