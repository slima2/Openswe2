import { GraphConfig } from "@open-swe/shared/open-swe/types";
import { join } from "path";
import { homedir } from "os";

/**
 * Checks if the current execution context is in local mode
 * (working on local files instead of sandbox/Daytona)
 */
export function isLocalMode(config?: GraphConfig): boolean {
  if (!config) {
    return isLocalModeFromEnv();
  }
  return (config.configurable as any)?.["x-local-mode"] === "true";
}

/**
 * Gets the local working directory for local mode operations
 * On Windows, creates project directories under user home
 */
export function getLocalWorkingDirectory(projectName?: string): string {
  // Check for explicit environment variable first
  if (process.env.OPEN_SWE_LOCAL_PROJECT_PATH) {
    return process.env.OPEN_SWE_LOCAL_PROJECT_PATH;
  }
  
  if (process.env.OPEN_SWE_PROJECT_PATH) {
    return process.env.OPEN_SWE_PROJECT_PATH;
  }
  
  // On Windows, use home directory structure
  if (process.platform === 'win32') {
    const baseDir = join(homedir(), 'open-swe-projects');
    if (projectName) {
      return join(baseDir, projectName);
    }
    return baseDir;
  }
  
  // Fallback to current working directory
  return process.cwd();
}

/**
 * Gets the project directory for a specific project
 * Creates nested directory structure for project organization
 */
export function getProjectDirectory(projectName: string, subDir?: string): string {
  const baseDir = getLocalWorkingDirectory(projectName);
  if (subDir) {
    return join(baseDir, subDir);
  }
  return baseDir;
}

/**
 * Converts Daytona-style paths to local Windows paths
 */
export function convertDaytonaPathToLocal(daytonaPath: string, projectName?: string): string {
  // Remove /home/daytona/ prefix if present
  let localPath = daytonaPath.replace(/^\/home\/daytona\/?/, '');
  
  // Extract project name from path if not provided
  if (!projectName && localPath) {
    const pathParts = localPath.split('/');
    if (pathParts.length > 0) {
      projectName = pathParts[0];
      localPath = pathParts.slice(1).join('/');
    }
  }
  
  // Get the appropriate project directory
  const projectDir = getProjectDirectory(projectName || 'default-project');
  
  // Return the full path
  if (localPath) {
    return join(projectDir, localPath);
  }
  return projectDir;
}

/**
 * Checks if we're in local mode based on environment variables
 * (useful for contexts where GraphConfig is not available)
 */
export function isLocalModeFromEnv(): boolean {
  // Always use local mode on Windows
  if (process.platform === 'win32') {
    return true;
  }
  return process.env.OPEN_SWE_LOCAL_MODE === "true";
}
