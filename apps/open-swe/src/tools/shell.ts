import { tool } from "@langchain/core/tools";
import { GraphState, GraphConfig } from "@open-swe/shared/open-swe/types";
import { getSandboxErrorFields } from "../utils/sandbox-error-fields.js";
import { TIMEOUT_SEC } from "@open-swe/shared/constants";
import { createShellToolFields } from "@open-swe/shared/open-swe/tools";
import { createShellExecutor } from "../utils/shell-executor/index.js";

const DEFAULT_ENV = {
  // Prevents corepack from showing a y/n download prompt which causes the command to hang
  COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
};

export function createShellTool(
  state: Pick<GraphState, "sandboxSessionId" | "targetRepository">,
  config: GraphConfig,
) {
  const shellTool = tool(
    async (input): Promise<{ result: string; status: "success" | "error" }> => {
      try {
        const { command, workdir, timeout } = input;

        const executor = createShellExecutor(config);
        const response = await executor.executeCommand({
          command,
          workdir,
          timeout: timeout ?? TIMEOUT_SEC,
          env: DEFAULT_ENV,
        });

        if (response.exitCode !== 0) {
          const errorResult = response.result ?? response.artifacts?.stdout;
          const errorExplanation = getExitCodeExplanation(response.exitCode);
          throw new Error(
            `Command failed. Exit code: ${response.exitCode}${errorExplanation}\nResult: ${errorResult}`,
          );
        }
        return {
          result: response.result ?? `exit code: ${response.exitCode}`,
          status: "success",
        };
      } catch (error: any) {
        const errorFields = getSandboxErrorFields(error);
        if (errorFields) {
          return {
            result: `Error: ${errorFields.result ?? errorFields.artifacts?.stdout}`,
            status: "error",
          };
        }

        return {
          result: `Error: ${error.message || String(error)}`,
          status: "error",
        };
      }
    },
    createShellToolFields(state.targetRepository),
  );

  return shellTool;
}

/**
 * Get a human-readable explanation for common exit codes
 */
function getExitCodeExplanation(exitCode: number): string {
  switch (exitCode) {
    case 1:
      return " (General error - command failed to execute properly)";
    case 2:
      return " (Syntax error - command has invalid syntax or arguments)";
    case 126:
      return " (Command not executable - file exists but cannot be executed)";
    case 127:
      return " (Command not found - binary not in PATH or doesn't exist)";
    case 128:
      return " (Invalid exit argument - exit code out of range)";
    case 139:
      return " (Segmentation fault - program crashed)";
    case 255:
      return " (Exit status out of range - command terminated abnormally)";
    default:
      return "";
  }
}
