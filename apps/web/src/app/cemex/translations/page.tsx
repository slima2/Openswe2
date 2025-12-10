"use client";

import React, { useState } from "react";
import { CemexLayout } from "@/components/cemex/CemexLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCemexAuth } from "@/hooks/useCemexAuth";
import {
  Languages,
  Search,
  Plus,
  Edit,
  Trash2,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";

interface Translation {
  id: string;
  translationKey: string;
  languageCode: string;
  languageName: string;
  translationValue: string;
  context: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for demonstration
const mockTranslations: Translation[] = [
  {
    id: "1",
    translationKey: "login.welcome_message",
    languageCode: "en",
    languageName: "English",
    translationValue: "Welcome to CEMEX Configuration Console",
    context: "authentication",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    translationKey: "login.welcome_message",
    languageCode: "es",
    languageName: "Spanish",
    translationValue: "Bienvenido a la Consola de Configuración CEMEX",
    context: "authentication",
    isActive: true,
    createdBy: "tech.user",
    createdAt: "2024-01-15T10:35:00Z",
    updatedAt: "2024-01-15T10:35:00Z",
  },
  {
    id: "3",
    translationKey: "error.invalid_credentials",
    languageCode: "en",
    languageName: "English",
    translationValue: "THE USER OR PASSWORD YOU ENTERED ARE INCORRECT. PLEASE TRY AGAIN.",
    context: "authentication",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "4",
    translationKey: "parameters.save_success",
    languageCode: "en",
    languageName: "English",
    translationValue: "YOUR CHANGES HAVE BEEN SAVED",
    context: "parameters",
    isActive: true,
    createdBy: "tech.user",
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "5",
    translationKey: "parameters.delete_success",
    languageCode: "en",
    languageName: "English",
    translationValue: "YOUR PARAMETER HAS BEEN DELETED SUCCESSFULLY",
    context: "parameters",
    isActive: true,
    createdBy: "admin.user",
    createdAt: "2024-01-12T16:45:00Z",
    updatedAt: "2024-01-12T16:45:00Z",
  },
];

const contexts = ["authentication", "parameters", "translations", "apps-keys", "audit-log", "general"];
const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
];

/**
 * CEMEX Translations Management Page
 * Manages internationalization translations with CRUD operations
 */
export default function CemexTranslationsPage() {
  const { user, canPerformCRUD, hasReadAccess } = useCemexAuth();
  const [translations, setTranslations] = useState<Translation[]>(mockTranslations);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedContext, setSelectedContext] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Filter translations based on search and filters
  const filteredTranslations = translations.filter(translation => {
    const matchesSearch = 
      translation.translationKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.translationValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.context.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLanguage = selectedLanguage === "all" || translation.languageCode === selectedLanguage;
    const matchesContext = selectedContext === "all" || translation.context === selectedContext;
    
    return matchesSearch && matchesLanguage && matchesContext;
  });

  // Group translations by key for better organization
  const groupedTranslations = filteredTranslations.reduce((acc, translation) => {
    if (!acc[translation.translationKey]) {
      acc[translation.translationKey] = [];
    }
    acc[translation.translationKey].push(translation);
    return acc;
  }, {} as Record<string, Translation[]>);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleAddTranslation = () => {
    console.log("Add translation");
  };

  const handleEditTranslation = (id: string) => {
    console.log("Edit translation:", id);
  };

  const handleDeleteTranslation = (id: string) => {
    console.log("Delete translation:", id);
  };

  return (
    <CemexLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Languages className="h-8 w-8" />
              Translations Management
            </h1>
            <p className="text-muted-foreground">
              Manage internationalization translations and language support
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {Object.keys(groupedTranslations).length} translation keys
            </Badge>
            <Badge variant="secondary">
              {filteredTranslations.length} total translations
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
                  {canPerformCRUD() && "CRUD operations available for translation management"}
                  {hasReadAccess() && !canPerformCRUD() && "Read-only access to view translations"}
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
              Filter and search translation entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Translations</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by key or value..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Language Filter */}
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {languages.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.name} ({language.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Context Filter */}
              <div className="space-y-2">
                <Label>Context</Label>
                <Select value={selectedContext} onValueChange={setSelectedContext}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Contexts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contexts</SelectItem>
                    {contexts.map((context) => (
                      <SelectItem key={context} value={context}>
                        {context.charAt(0).toUpperCase() + context.slice(1)}
                      </SelectItem>
                    ))}
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
                      onClick={handleAddTranslation}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Support Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language Support Overview
            </CardTitle>
            <CardDescription>
              Current language support and coverage statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {languages.map((language) => {
                const languageTranslations = translations.filter(t => t.languageCode === language.code);
                const coverage = Math.round((languageTranslations.length / Object.keys(groupedTranslations).length) * 100);
                
                return (
                  <div key={language.code} className="text-center p-4 rounded-lg border">
                    <div className="text-2xl font-bold">{languageTranslations.length}</div>
                    <div className="text-sm text-muted-foreground">{language.name}</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {coverage}% coverage
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Translations List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Translation Entries</CardTitle>
            <CardDescription>
              Manage translation keys and their language-specific values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.keys(groupedTranslations).length === 0 ? (
                <div className="text-center py-8">
                  <Languages className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Translations Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || selectedLanguage !== "all" || selectedContext !== "all"
                      ? "Try adjusting your search criteria or filters."
                      : "No translation entries are currently available."}
                  </p>
                </div>
              ) : (
                Object.entries(groupedTranslations).map(([key, keyTranslations]) => (
                  <Card key={key} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-mono">{key}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {keyTranslations[0]?.context}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {keyTranslations.length} language{keyTranslations.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                        {canPerformCRUD() && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddTranslation()}
                            >
                              <Plus className="h-4 w-4" />
                              Add Language
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {keyTranslations.map((translation) => (
                          <div key={translation.id} className="flex items-start gap-4 p-3 rounded-lg border">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {translation.languageName} ({translation.languageCode})
                                </Badge>
                                {translation.isActive && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-600">Active</span>
                                  </div>
                                )}
                              </div>
                              <div className="bg-muted p-3 rounded text-sm">
                                {translation.translationValue}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Last updated: {new Date(translation.updatedAt).toLocaleDateString()} by {translation.createdBy}
                              </div>
                            </div>
                            
                            {canPerformCRUD() && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTranslation(translation.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteTranslation(translation.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Translation Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Translation Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Key Naming Conventions</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Use dot notation: module.component.message</li>
                  <li>• Keep keys descriptive and consistent</li>
                  <li>• Use lowercase with underscores</li>
                  <li>• Group related translations by context</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Translation Best Practices</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Maintain consistent tone and style</li>
                  <li>• Consider cultural context</li>
                  <li>• Keep translations concise</li>
                  <li>• Test UI with longer translations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CemexLayout>
  );
}
