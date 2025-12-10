import { useState, useEffect, useCallback } from "react";
import { CemexUser, CemexRole } from "@/lib/cemex-auth";

interface CemexAuthState {
  user: CemexUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  username: string;
  password: string;
  region?: "AME" | "EUR";
  environment?: "QA" | "PROD";
}

interface CemexAuthHook extends CemexAuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasRole: (roles: CemexRole[]) => boolean;
  canImportExport: () => boolean;
  canPerformCRUD: () => boolean;
  hasReadAccess: () => boolean;
}

/**
 * Custom hook for CEMEX authentication
 * Provides authentication state and methods for CEMEX console
 */
export function useCemexAuth(): CemexAuthHook {
  const [state, setState] = useState<CemexAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Check authentication status
   */
  const checkAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch("/api/cemex/auth/status", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.authenticated && data.user) {
        setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: data.error || null,
        });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Failed to check authentication status",
      });
    }
  }, []);

  /**
   * Login with CEMEX credentials
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch("/api/cemex/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || "Login failed",
        }));
        return false;
      }
    } catch (error) {
      console.error("Login failed:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Login request failed",
      }));
      return false;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch("/api/cemex/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local state even if logout request fails
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  /**
   * Check if user has required roles
   */
  const hasRole = useCallback((roles: CemexRole[]): boolean => {
    if (!state.user) return false;
    return roles.includes(state.user.cemexRole as CemexRole);
  }, [state.user]);

  /**
   * Check if user can perform import/export operations
   */
  const canImportExport = useCallback((): boolean => {
    return hasRole(["Console Admin"]);
  }, [hasRole]);

  /**
   * Check if user can perform CRUD operations
   */
  const canPerformCRUD = useCallback((): boolean => {
    return hasRole(["Console Admin", "Technical"]);
  }, [hasRole]);

  /**
   * Check if user has read access
   */
  const hasReadAccess = useCallback((): boolean => {
    return hasRole(["Console Admin", "Technical", "Guest"]);
  }, [hasRole]);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...state,
    login,
    logout,
    checkAuth,
    hasRole,
    canImportExport,
    canPerformCRUD,
    hasReadAccess,
  };
}
