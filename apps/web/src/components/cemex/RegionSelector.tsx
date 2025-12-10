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
import { useCemexAuth } from "@/hooks/useCemexAuth";
import { Globe, MapPin, AlertCircle } from "lucide-react";

interface RegionSelectorProps {
  className?: string;
  onRegionChange?: (region: string) => void;
  disabled?: boolean;
  showDescription?: boolean;
}

interface RegionInfo {
  code: string;
  name: string;
  description: string;
  timezone: string;
  countries: string[];
  color: string;
}

const REGIONS: RegionInfo[] = [
  {
    code: "AME",
    name: "Americas",
    description: "North, Central, and South America operations",
    timezone: "UTC-6 to UTC-3",
    countries: ["US", "MX", "CO", "CR", "DO", "GT", "NI", "PA", "PH"],
    color: "bg-blue-500",
  },
  {
    code: "EUR",
    name: "Europe",
    description: "European operations and subsidiaries",
    timezone: "UTC+1 to UTC+2",
    countries: ["UK", "DE", "FR", "ES", "PL", "CZ"],
    color: "bg-green-500",
  },
];

/**
 * CEMEX Region Selector Component
 * Allows users to select and switch between CEMEX regions (AME/EUR)
 * Displays region-specific information and validates access permissions
 */
export function RegionSelector({
  className,
  onRegionChange,
  disabled = false,
  showDescription = true,
}: RegionSelectorProps) {
  const { user } = useCemexAuth();
  const [selectedRegion, setSelectedRegion] = useState<string>(user?.region || "");

  const handleRegionChange = (regionCode: string) => {
    setSelectedRegion(regionCode);
    onRegionChange?.(regionCode);
  };

  const getCurrentRegionInfo = () => {
    return REGIONS.find(region => region.code === (selectedRegion || user?.region));
  };

  const currentRegion = getCurrentRegionInfo();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Region Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Region Selection
          </CardTitle>
          {showDescription && (
            <CardDescription>
              Select the CEMEX region for configuration management. Your access may be restricted based on your assigned region.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current User Region Info */}
            {user?.region && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Your assigned region:</span>
                <Badge variant="secondary" className="font-medium">
                  {user.region} - {REGIONS.find(r => r.code === user.region)?.name}
                </Badge>
              </div>
            )}

            {/* Region Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Region</label>
              <Select
                value={selectedRegion}
                onValueChange={handleRegionChange}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a region..." />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => (
                    <SelectItem key={region.code} value={region.code}>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full", region.color)} />
                        <span className="font-medium">{region.code}</span>
                        <span className="text-muted-foreground">- {region.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Access Validation Warning */}
            {user?.region && selectedRegion && selectedRegion !== user.region && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Region Access Warning</p>
                  <p className="text-destructive/80">
                    You are selecting a region ({selectedRegion}) different from your assigned region ({user.region}). 
                    Access to configuration data may be restricted.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Region Information */}
      {currentRegion && showDescription && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <div className={cn("h-4 w-4 rounded-full", currentRegion.color)} />
              {currentRegion.name} Region ({currentRegion.code})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {currentRegion.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Timezone:</span>
                  <p className="text-muted-foreground">{currentRegion.timezone}</p>
                </div>
                
                <div>
                  <span className="font-medium">Countries:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentRegion.countries.map((country) => (
                      <Badge key={country} variant="outline" className="text-xs">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Region Status */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Region Active</span>
                </div>
                {user?.region === currentRegion.code && (
                  <Badge variant="secondary" className="text-xs">
                    Your Region
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
