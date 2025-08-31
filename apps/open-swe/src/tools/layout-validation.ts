import { tool } from "@langchain/core/tools";
import { GraphState, GraphConfig } from "@open-swe/shared/open-swe/types";
import { createLogger, LogLevel } from "../utils/logger.js";
import { getRepoAbsolutePath } from "@open-swe/shared/git";
import {
  isLocalMode,
  getLocalWorkingDirectory,
} from "@open-swe/shared/open-swe/local-mode";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const logger = createLogger(LogLevel.INFO, "LayoutValidationTool");

export function createLayoutValidationTool(
  state: Pick<GraphState, "sandboxSessionId" | "targetRepository">,
  config: GraphConfig,
) {
  const layoutValidationTool = tool(
    async (input): Promise<{ result: string; status: "success" | "error" }> => {
      try {
        // Validate input type
        if (typeof input !== 'object' || input === null) {
          throw new Error("Input must be an object");
        }
        
        const { action, target_path } = input as { action: string; target_path?: string };
        
        if (!action) {
          throw new Error("action is required");
        }
        
        const localMode = isLocalMode(config);
        const localAbsolutePath = getLocalWorkingDirectory();
        const sandboxAbsolutePath = getRepoAbsolutePath(state.targetRepository);
        const workDir = localMode ? localAbsolutePath : sandboxAbsolutePath;

        logger.info("Running layout validation", {
          action,
          target_path,
          workDir,
          localMode,
        });

        let result: string;

        switch (action) {
          case "validate_structure": {
            result = await validateProjectStructure(workDir);
            break;
          }
          case "check_path": {
            if (!target_path) {
              throw new Error("target_path is required for check_path action");
            }
            result = await checkPathExists(workDir, target_path);
            break;
          }
          case "get_relative_path": {
            if (!target_path) {
              throw new Error("target_path is required for get_relative_path action");
            }
            result = await getRelativePath(workDir, target_path);
            break;
          }
          case "list_directory": {
            if (!target_path) {
              throw new Error("target_path is required for list_directory action");
            }
            result = await listDirectoryContents(workDir, target_path);
            break;
          }
          default:
            throw new Error(`Unknown action: ${action}. Valid actions: validate_structure, check_path, get_relative_path, list_directory`);
        }

        logger.info(`Layout validation '${action}' completed successfully`);
        return { result, status: "success" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Layout validation failed: ${errorMessage}`);
        return {
          result: `Error: ${errorMessage}`,
          status: "error",
        };
      }
    },
    {
      name: "layout_validation",
      description: "Validate project layout and structure before code generation",
      schema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["validate_structure", "check_path", "get_relative_path", "list_directory"],
            description: "The validation action to perform",
          },
          target_path: {
            type: "string",
            description: "Target path to check (required for check_path, get_relative_path, list_directory actions)",
          },
        },
        required: ["action"],
      },
    },
  );

  return layoutValidationTool;
}

/**
 * Validate the overall project structure
 */
async function validateProjectStructure(workDir: string): Promise<string> {
  const structure: Record<string, any> = {};
  
  // Check common project directories
  const commonDirs = [
    "src", "backend", "frontend", "config", "models", "controllers", 
    "routes", "utils", "tests", "docs", "public", "assets"
  ];
  
  for (const dir of commonDirs) {
    const fullPath = join(workDir, dir);
    if (existsSync(fullPath)) {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        structure[dir] = {
          exists: true,
          type: "directory",
          contents: listDirectoryContents(workDir, dir)
        };
      }
    } else {
      structure[dir] = { exists: false };
    }
  }
  
  // Check for package.json and other config files
  const configFiles = ["package.json", "tsconfig.json", "README.md", ".env", ".gitignore"];
  for (const file of configFiles) {
    const fullPath = join(workDir, file);
    structure[file] = { exists: existsSync(fullPath) };
  }
  
  return `Project Structure Validation:\n\n${JSON.stringify(structure, null, 2)}`;
}

/**
 * Check if a specific path exists
 */
async function checkPathExists(workDir: string, targetPath: string): Promise<string> {
  const fullPath = join(workDir, targetPath);
  const exists = existsSync(fullPath);
  
  if (exists) {
    const stat = statSync(fullPath);
    return `Path '${targetPath}' exists and is a ${stat.isDirectory() ? 'directory' : 'file'}`;
  } else {
    return `Path '${targetPath}' does not exist`;
  }
}

/**
 * Get relative path from workDir to targetPath
 */
async function getRelativePath(workDir: string, targetPath: string): Promise<string> {
  const fullPath = join(workDir, targetPath);
  
  if (!existsSync(fullPath)) {
    throw new Error(`Path '${targetPath}' does not exist`);
  }
  
  // Calculate relative path
  const relativePath = targetPath.replace(/\\/g, '/');
  return `Relative path: ${relativePath}`;
}

/**
 * List contents of a directory
 */
async function listDirectoryContents(workDir: string, targetPath: string): Promise<string> {
  const fullPath = join(workDir, targetPath);
  
  if (!existsSync(fullPath)) {
    throw new Error(`Path '${targetPath}' does not exist`);
  }
  
  const stat = statSync(fullPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path '${targetPath}' is not a directory`);
  }
  
  try {
    const items = readdirSync(fullPath);
    const contents = items.map(item => {
      const itemPath = join(fullPath, item);
      const itemStat = statSync(itemPath);
      return {
        name: item,
        type: itemStat.isDirectory() ? 'directory' : 'file',
        size: itemStat.isFile() ? itemStat.size : undefined
      };
    });
    
    return `Directory '${targetPath}' contents:\n${contents.map(item => 
      `  ${item.type === 'directory' ? '📁' : '📄'} ${item.name}${item.size ? ` (${item.size} bytes)` : ''}`
    ).join('\n')}`;
  } catch (error) {
    throw new Error(`Cannot read directory '${targetPath}': ${error instanceof Error ? error.message : String(error)}`);
  }
}
