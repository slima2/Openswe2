"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Save, X } from "lucide-react";

// Parameter form validation schema
const parameterFormSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  paramKey: z.string()
    .min(1, "Parameter key is required")
    .max(255, "Parameter key must be less than 255 characters")
    .regex(/^[A-Z0-9_]+$/, "Parameter key must contain only uppercase letters, numbers, and underscores"),
  paramValue: z.string().optional(),
  paramType: z.enum(["STRING", "INTEGER", "BOOLEAN", "JSON", "DECIMAL"]),
  environment: z.enum(["QA", "PROD", "DEMO", "DEV", "DEV2", "QA2", "PRE-PROD"]),
  region: z.string().optional(),
  isActive: z.boolean(),
});

type ParameterFormData = z.infer<typeof parameterFormSchema>;

interface Service {
  id: string;
  serviceName: string;
  serviceCode: string;
}

interface ConfigurationParameter {
  id?: string;
  serviceId: string;
  serviceName?: string;
  paramKey: string;
  paramValue?: string;
  paramType: string;
  environment: string;
  region?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ParameterFormProps {
  parameter?: ConfigurationParameter;
  services: Service[];
  onSubmit: (data: ParameterFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

/**
 * CEMEX Parameter Form Component
 * Handles creation and editing of configuration parameters with validation
 */
export function ParameterForm({
  parameter,
  services,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}: ParameterFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ParameterFormData>({
    serviceId: parameter?.serviceId || "",
    paramKey: parameter?.paramKey || "",
    paramValue: parameter?.paramValue || "",
    paramType: (parameter?.paramType as any) || "STRING",
    environment: (parameter?.environment as any) || "QA",
    region: parameter?.region || "",
    isActive: parameter?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Reset form when parameter changes
  useEffect(() => {
    if (parameter) {
      setFormData({
        serviceId: parameter.serviceId,
        paramKey: parameter.paramKey,
        paramValue: parameter.paramValue || "",
        paramType: parameter.paramType as any,
        environment: parameter.environment as any,
        region: parameter.region || "",
        isActive: parameter.isActive,
      });
      setIsDirty(false);
      setErrors({});
    }
  }, [parameter]);

  const updateFormData = (field: keyof ParameterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const validationResult = parameterFormSchema.safeParse(formData);
      if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        validationResult.error.errors.forEach((error) => {
          if (error.path.length > 0) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
        return;
      }

      setFieldErrors({});
      setErrors({});
      await onSubmit(validationResult.data);
    } catch (error: any) {
      // Handle validation errors from API
      if (error.details && Array.isArray(error.details)) {
        const newFieldErrors: Record<string, string> = {};
        error.details.forEach((detail: any) => {
          if (detail.path && detail.path.length > 0) {
            newFieldErrors[detail.path[0]] = detail.message;
          }
        });
        setFieldErrors(newFieldErrors);
      }
    }
  };

  const getEnvironmentBadgeVariant = (env: string) => {
    switch (env) {
      case "PROD": return "destructive";
      case "QA": return "default";
      default: return "secondary";
    }
  };

  const validateParameterValue = (value: string, type: string) => {
    if (!value) return true; // Optional field

    switch (type) {
      case "INTEGER":
        return /^-?\d+$/.test(value) || "Must be a valid integer";
      case "DECIMAL":
        return /^-?\d+(\.\d+)?$/.test(value) || "Must be a valid decimal number";
      case "BOOLEAN":
        return /^(true|false)$/i.test(value) || "Must be 'true' or 'false'";
      case "JSON":
        try {
          JSON.parse(value);
          return true;
        } catch {
          return "Must be valid JSON";
        }
      default:
        return true;
    }
  };

  const handleInputChange = (field: keyof ParameterFormData, value: any) => {
    updateFormData(field, value);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === "create" ? "Add New Parameter" : "Edit Parameter"}
          {watchedEnvironment === "PROD" && (
            <Badge variant="destructive" className="text-xs">
              Production Environment
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {mode === "create" 
            ? "Create a new configuration parameter for the selected service"
            : "Modify the configuration parameter details"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="serviceId">
              Service <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.serviceId}
              onValueChange={(value) => handleInputChange("serviceId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service..." />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{service.serviceName}</span>
                      <Badge variant="outline" className="text-xs">
                        {service.serviceCode}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(errors.serviceId || fieldErrors.serviceId) && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.serviceId || fieldErrors.serviceId}
              </p>
            )}
          </div>

          {/* Parameter Key */}
          <div className="space-y-2">
            <Label htmlFor="paramKey">
              Parameter Key <span className="text-destructive">*</span>
            </Label>
            <Input
              id="paramKey"
              value={formData.paramKey}
              onChange={(e) => handleInputChange("paramKey", e.target.value)}
              placeholder="e.g., MAX_LOGIN_ATTEMPTS"
              className={errors.paramKey || fieldErrors.paramKey ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Use uppercase letters, numbers, and underscores only. Max 255 characters.
            </p>
            {(errors.paramKey || fieldErrors.paramKey) && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.paramKey || fieldErrors.paramKey}
              </p>
            )}
          </div>

          {/* Parameter Type */}
          <div className="space-y-2">
            <Label htmlFor="paramType">
              Parameter Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.paramType}
              onValueChange={(value) => handleInputChange("paramType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRING">String - Text values</SelectItem>
                <SelectItem value="INTEGER">Integer - Whole numbers</SelectItem>
                <SelectItem value="DECIMAL">Decimal - Decimal numbers</SelectItem>
                <SelectItem value="BOOLEAN">Boolean - true/false values</SelectItem>
                <SelectItem value="JSON">JSON - Complex objects</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Parameter Value */}
          <div className="space-y-2">
            <Label htmlFor="paramValue">Parameter Value</Label>
            {watchedParamType === "JSON" ? (
              <Textarea
                id="paramValue"
                {...register("paramValue", {
                  validate: (value) => validateParameterValue(value || "", watchedParamType),
                })}
                placeholder='{"key": "value"}'
                rows={4}
                className={errors.paramValue ? "border-destructive" : ""}
              />
            ) : (
              <Input
                id="paramValue"
                {...register("paramValue", {
                  validate: (value) => validateParameterValue(value || "", watchedParamType),
                })}
                placeholder={
                  watchedParamType === "INTEGER" ? "123" :
                  watchedParamType === "DECIMAL" ? "123.45" :
                  watchedParamType === "BOOLEAN" ? "true" :
                  "Enter parameter value"
                }
                className={errors.paramValue ? "border-destructive" : ""}
              />
            )}
            {errors.paramValue && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.paramValue.message}
              </p>
            )}
          </div>

          {/* Environment and Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="environment">
                Environment <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchedEnvironment}
                onValueChange={(value) => setValue("environment", value as any, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QA">QA - Quality Assurance</SelectItem>
                  <SelectItem value="PROD">PROD - Production</SelectItem>
                  <SelectItem value="DEV">DEV - Development</SelectItem>
                  <SelectItem value="DEV2">DEV2 - Development 2</SelectItem>
                  <SelectItem value="QA2">QA2 - Quality Assurance 2</SelectItem>
                  <SelectItem value="PRE-PROD">PRE-PROD - Pre-Production</SelectItem>
                  <SelectItem value="DEMO">DEMO - Demonstration</SelectItem>
                </SelectContent>
              </Select>
              {watchedEnvironment === "PROD" && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Production environment - changes affect live systems
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                {...register("region")}
                placeholder="e.g., AME, EUR"
                className={errors.region ? "border-destructive" : ""}
              />
              {errors.region && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.region.message}
                </p>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked, { shouldDirty: true })}
            />
            <Label htmlFor="isActive">Parameter is active</Label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isDirty}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : mode === "create" ? "Create Parameter" : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}






