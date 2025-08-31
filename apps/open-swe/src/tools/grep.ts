import { tool } from "@langchain/core/tools";
import { GraphState, GraphConfig } from "@open-swe/shared/open-swe/types";
import { getSandboxErrorFields } from "../utils/sandbox-error-fields.js";
import { createLogger, LogLevel } from "../utils/logger.js";
import { TIMEOUT_SEC } from "@open-swe/shared/constants";
import { getRepoAbsolutePath } from "@open-swe/shared/git";
import {
  isLocalMode,
  getLocalWorkingDirectory,
} from "@open-swe/shared/open-swe/local-mode";
import {
  createGrepToolFields,
  formatGrepCommand,
} from "@open-swe/shared/open-swe/tools";
import { createShellExecutor } from "../utils/shell-executor/index.js";
import { wrapScript } from "../utils/wrap-script.js";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const logger = createLogger(LogLevel.INFO, "GrepTool");

export function createGrepTool(
  state: Pick<GraphState, "sandboxSessionId" | "targetRepository">,
  config: GraphConfig,
) {
  const grepTool = tool(
    async (input): Promise<{ result: string; status: "success" | "error" }> => {
      try {
        const command = formatGrepCommand(input);
        const localMode = isLocalMode(config);
        const localAbsolutePath = getLocalWorkingDirectory();
        const sandboxAbsolutePath = getRepoAbsolutePath(state.targetRepository);
        const workDir = localMode ? localAbsolutePath : sandboxAbsolutePath;

        logger.info("Running grep search command", {
          command: command.join(" "),
          workDir,
        });

        const executor = createShellExecutor(config);
        const response = await executor.executeCommand({
          command: wrapScript(command.join(" ")),
          workdir: workDir,
          timeout: TIMEOUT_SEC,
        });

        let successResult = response.result;

        if (response.exitCode === 127) {
          // Command not found - try JavaScript fallback
          logger.info("Grep command not found, using JavaScript fallback");
          try {
            const jsResult = await performJavaScriptSearch(input, workDir);
            return {
              result: `Grep command not available, using JavaScript search:\n\n${jsResult}`,
              status: "success",
            };
          } catch (jsError) {
            logger.error("JavaScript fallback also failed", { error: jsError });
            throw new Error(
              `Grep command not available (exit code 127) and JavaScript fallback failed: ${jsError instanceof Error ? jsError.message : String(jsError)}`,
            );
          }
        } else if (
          response.exitCode === 1 ||
          (response.exitCode === 127 && response.result.startsWith("sh: 1: "))
        ) {
          const errorResult = response.result ?? response.artifacts?.stdout;
          successResult = `Exit code 1. No results found.\n\n${errorResult}`;
        } else if (response.exitCode > 1) {
          const errorResult = response.result ?? response.artifacts?.stdout;
          throw new Error(
            `Failed to run grep search command. Exit code: ${response.exitCode}\nError: ${errorResult}`,
          );
        }

        return {
          result: successResult,
          status: "success",
        };
      } catch (e) {
        const errorFields = getSandboxErrorFields(e);
        if (errorFields) {
          const errorResult =
            errorFields.result ?? errorFields.artifacts?.stdout;
          return {
            result: `Failed to run search command. Exit code: ${errorFields.exitCode}\nError: ${errorResult}`,
            status: "error" as const,
          };
        }

        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
          result: `Failed to run grep search command: ${errorMessage}`,
          status: "error" as const,
        };
      }
    },
    createGrepToolFields(state.targetRepository),
  );

  return grepTool;
}

/**
 * JavaScript fallback for grep search when the command is not available
 */
async function performJavaScriptSearch(
  input: any,
  workDir: string,
): Promise<string> {
  const { query, include_pattern, exclude_pattern } = input;
  
  if (!query) {
    throw new Error("Search query is required");
  }

  const searchRegex = new RegExp(query, 'i');
  
  try {
    // Recursively search through files
    const searchResults = searchFilesRecursively(workDir, searchRegex, include_pattern, exclude_pattern);
    
    if (searchResults.length === 0) {
      return "No matches found using JavaScript search.";
    }
    
    // Format results similar to grep output
    return searchResults.map(result => 
      `${result.file}:${result.line}: ${result.content}`
    ).join('\n');
  } catch (error) {
    throw new Error(`JavaScript search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Recursively search through files for text matching the regex
 */
function searchFilesRecursively(
  dir: string,
  regex: RegExp,
  includePattern?: string,
  excludePattern?: string,
): Array<{ file: string; line: number; content: string }> {
  const results: Array<{ file: string; line: number; content: string }> = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .git directories
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
          continue;
        }
        
        // Recursively search subdirectories
        const subResults = searchFilesRecursively(fullPath, regex, includePattern, excludePattern);
        results.push(...subResults);
      } else if (stat.isFile()) {
        // Check if file should be included/excluded
        if (includePattern && !new RegExp(includePattern).test(item)) {
          continue;
        }
        if (excludePattern && new RegExp(excludePattern).test(item)) {
          continue;
        }
        
        // Skip binary files and large files
        if (stat.size > 1024 * 1024) { // Skip files larger than 1MB
          continue;
        }
        
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          
          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              const relativePath = fullPath.replace(dir, '').replace(/\\/g, '/');
              results.push({
                file: relativePath.startsWith('/') ? relativePath.slice(1) : relativePath,
                line: i + 1,
                content: lines[i].trim()
              });
            }
          }
        } catch (_readError) {
          // Skip files that can't be read (binary files, etc.)
          continue;
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be accessed
    logger.warn(`Cannot access directory: ${dir}`, { error });
  }
  
  return results;
}
