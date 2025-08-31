import { join, dirname } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { tool } from "@langchain/core/tools";
import { GraphState, GraphConfig } from "@open-swe/shared/open-swe/types";
import { createLogger, LogLevel } from "../../utils/logger.js";
import { getRepoAbsolutePath } from "@open-swe/shared/git";
import { getSandboxSessionOrThrow } from "../utils/get-sandbox-id.js";
import { createTextEditorToolFields } from "@open-swe/shared/open-swe/tools";
import {
  handleViewCommand,
  handleStrReplaceCommand,
  handleCreateCommand,
  handleInsertCommand,
} from "./handlers.js";
import {
  isLocalMode,
  getLocalWorkingDirectory,
  convertDaytonaPathToLocal,
} from "@open-swe/shared/open-swe/local-mode";

const logger = createLogger(LogLevel.INFO, "TextEditorTool");

export function createTextEditorTool(
  state: Pick<GraphState, "sandboxSessionId" | "targetRepository">,
  config: GraphConfig,
) {
  const textEditorTool = tool(
    async (input): Promise<{ result: string; status: "success" | "error" }> => {
      try {
        const {
          command,
          path,
          view_range,
          old_str,
          new_str,
          file_text,
          insert_line,
        } = input;

        const localMode = isLocalMode(config);
        const localAbsolutePath = getLocalWorkingDirectory();
        const sandboxAbsolutePath = getRepoAbsolutePath(state.targetRepository);
        const workDir = localMode ? localAbsolutePath : sandboxAbsolutePath;
        let result: string;

        if (localMode) {
          // Local mode: use Node.js file operations directly

          // Convert Daytona path to local Windows path
          let filePath: string;
          if (path.startsWith("/home/daytona/")) {
            // Extract project name from path
            const match = path.match(/^\/home\/daytona\/([^/]+)/);
            const projectName = match ? match[1] : "default-project";
            filePath = convertDaytonaPathToLocal(path, projectName);
          } else {
            // Use path as-is if it's already a local path
            filePath = path.includes(':') ? path : join(workDir, path);
          }

          // Check if path is a directory and handle appropriately
          if (existsSync(filePath)) {
            const stats = statSync(filePath);
            if (stats.isDirectory()) {
              // If it's a directory, provide a helpful error message
              throw new Error(`Cannot perform '${command}' operation on directory: ${path}. Use 'ls' or 'tree' command to list directory contents instead.`);
            }
          }

          switch (command) {
            case "view": {
              // Use Node.js file system to read file
              try {
                if (!existsSync(filePath)) {
                  throw new Error(`File not found: ${filePath}`);
                }
                result = readFileSync(filePath, 'utf-8');
              } catch (error: any) {
                throw new Error(`Failed to read file: ${error.message}`);
              }
              break;
            }
            case "str_replace": {
              if (!old_str || new_str === undefined) {
                throw new Error(
                  "str_replace command requires both old_str and new_str parameters",
                );
              }
              // Use Node.js file system for string replacement
              try {
                if (!existsSync(filePath)) {
                  throw new Error(`File not found: ${filePath}`);
                }
                let content = readFileSync(filePath, 'utf-8');
                const occurrences = content.split(old_str).length - 1;
                if (occurrences === 0) {
                  throw new Error(`String '${old_str}' not found in file`);
                }
                content = content.replace(new RegExp(old_str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), new_str);
                writeFileSync(filePath, content, 'utf-8');
                result = `Successfully replaced ${occurrences} occurrence(s) of '${old_str}' with '${new_str}' in ${path}`;
              } catch (error: any) {
                throw new Error(`Failed to replace string: ${error.message}`);
              }
              break;
            }
            case "create": {
              if (!file_text) {
                throw new Error("create command requires file_text parameter");
              }
              // Use Node.js file system to create file
              try {
                // Create directory if it doesn't exist
                const dir = dirname(filePath);
                if (!existsSync(dir)) {
                  mkdirSync(dir, { recursive: true });
                }
                writeFileSync(filePath, file_text, 'utf-8');
                result = `Successfully created file ${path}`;
              } catch (error: any) {
                throw new Error(`Failed to create file: ${error.message}`);
              }
              break;
            }
            case "insert": {
              if (insert_line === undefined || new_str === undefined) {
                throw new Error(
                  "insert command requires both insert_line and new_str parameters",
                );
              }
              // Use Node.js file system to insert line
              try {
                if (!existsSync(filePath)) {
                  throw new Error(`File not found: ${filePath}`);
                }
                const content = readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                // Insert at the specified line (0-based index)
                lines.splice(insert_line, 0, new_str);
                writeFileSync(filePath, lines.join('\n'), 'utf-8');
                result = `Successfully inserted line at position ${insert_line} in ${path}`;
              } catch (error: any) {
                throw new Error(`Failed to insert line: ${error.message}`);
              }
              break;
            }
            default:
              throw new Error(`Unknown command: ${command}`);
          }
        } else {
          // Sandbox mode: use existing handler
          const sandbox = await getSandboxSessionOrThrow(input);

          switch (command) {
            case "view":
              result = await handleViewCommand(sandbox, config, {
                path,
                workDir,
                viewRange: view_range,
              });
              break;
            case "str_replace":
              if (!old_str || new_str === undefined) {
                throw new Error(
                  "str_replace command requires both old_str and new_str parameters",
                );
              }
              result = await handleStrReplaceCommand(sandbox, config, {
                path,
                workDir,
                oldStr: old_str,
                newStr: new_str,
              });
              break;
            case "create":
              if (!file_text) {
                throw new Error("create command requires file_text parameter");
              }
              result = await handleCreateCommand(sandbox, config, {
                path,
                workDir,
                fileText: file_text,
              });
              break;
            case "insert":
              if (insert_line === undefined || new_str === undefined) {
                throw new Error(
                  "insert command requires both insert_line and new_str parameters",
                );
              }
              result = await handleInsertCommand(sandbox, config, {
                path,
                workDir,
                insertLine: insert_line,
                newStr: new_str,
              });
              break;
            default:
              throw new Error(`Unknown command: ${command}`);
          }
        }

        logger.info(
          `Text editor command '${command}' executed successfully on ${path}`,
        );
        return { result, status: "success" };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Text editor command failed: ${errorMessage}`);
        return {
          result: `Error: ${errorMessage}`,
          status: "error",
        };
      }
    },
    createTextEditorToolFields(state.targetRepository, config),
  );

  return textEditorTool;
}
