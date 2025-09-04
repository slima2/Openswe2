import { getCurrentTaskInput } from "@langchain/langgraph";
import {
  GraphState,
  TargetRepository,
  GraphConfig,
} from "@open-swe/shared/open-swe/types";
import { createLogger, LogLevel } from "./logger.js";
import path from "node:path";
import { SANDBOX_ROOT_DIR, TIMEOUT_SEC } from "@open-swe/shared/constants";
import { getSandboxErrorFields } from "./sandbox-error-fields.js";
import { isLocalMode } from "@open-swe/shared/open-swe/local-mode";
import { createShellExecutor } from "./shell-executor/index.js";

const logger = createLogger(LogLevel.INFO, "Tree");

export const FAILED_TO_GENERATE_TREE_MESSAGE =
  "Failed to generate tree. Please try again.";

/**
 * Format a list of file paths into a tree-like structure
 */
function formatFilesAsTree(files: string[]): string {
  if (!files || files.length === 0) {
    return "Empty directory";
  }

  const tree: string[] = ["."];
  const processed = new Set<string>();
  
  // Group files by directory
  for (const file of files) {
    const parts = file.split('/');
    const depth = Math.min(parts.length - 1, 3); // Limit to 3 levels deep
    
    for (let i = 0; i <= depth; i++) {
      const path = parts.slice(0, i + 1).join('/');
      if (!processed.has(path)) {
        processed.add(path);
        const indent = "│   ".repeat(i);
        const prefix = i === parts.length - 1 ? "├── " : "├── ";
        const name = parts[i];
        tree.push(indent + prefix + name);
      }
    }
  }
  
  return tree.join('\n');
}

export async function getCodebaseTree(
  config: GraphConfig,
  sandboxSessionId_?: string,
  targetRepository_?: TargetRepository,
): Promise<string> {
  try {
    const command = `git ls-files | tree --fromfile -L 3`;
    let sandboxSessionId = sandboxSessionId_;
    let targetRepository = targetRepository_;

    // Check if we're in local mode
    if (isLocalMode(config)) {
      return getCodebaseTreeLocal(config);
    }

    // If sandbox session ID is not provided, try to get it from the current state.
    if (!sandboxSessionId || !targetRepository) {
      try {
        const state = getCurrentTaskInput<GraphState>();
        // Prefer the provided sandbox session ID and target repository. Fallback to state if defined.
        sandboxSessionId = sandboxSessionId ?? state.sandboxSessionId;
        targetRepository = targetRepository ?? state.targetRepository;
      } catch {
        // not executed in a LangGraph instance. continue.
      }
    }

    if (!sandboxSessionId) {
      logger.error("Failed to generate tree: No sandbox session ID provided");
      throw new Error("Failed generate tree: No sandbox session ID provided");
    }
    if (!targetRepository) {
      logger.error("Failed to generate tree: No target repository provided");
      throw new Error("Failed generate tree: No target repository provided");
    }

    const executor = createShellExecutor(config);
    const repoDir = path.join(SANDBOX_ROOT_DIR, targetRepository.repo);
    const response = await executor.executeCommand({
      command,
      workdir: repoDir,
      timeout: TIMEOUT_SEC,
      sandboxSessionId,
    });

    if (response.exitCode !== 0) {
      logger.error("Failed to generate tree", {
        exitCode: response.exitCode,
        result: response.result ?? response.artifacts?.stdout,
      });
      throw new Error(
        `Failed to generate tree: ${response.result ?? response.artifacts?.stdout}`,
      );
    }

    return response.result;
  } catch (e) {
    const errorFields = getSandboxErrorFields(e);
    logger.error("Failed to generate tree", {
      ...(errorFields ? { errorFields } : {}),
      ...(e instanceof Error
        ? {
            name: e.name,
            message: e.message,
            stack: e.stack,
          }
        : {}),
    });
    return FAILED_TO_GENERATE_TREE_MESSAGE;
  }
}

/**
 * Local version of getCodebaseTree using ShellExecutor
 */
async function getCodebaseTreeLocal(config: GraphConfig): Promise<string> {
  try {
    const executor = createShellExecutor(config);
    
    // Use a simpler command for Windows that doesn't require tree
    const isWindows = process.platform === 'win32';
    const command = isWindows 
      ? `git ls-files`  // Just list files, we'll format them later
      : `git ls-files | tree --fromfile -L 3`;

    const response = await executor.executeCommand({
      command,
      timeout: TIMEOUT_SEC,
    });

    // If git ls-files fails, try to initialize Git repository
    if (response.exitCode !== 0) {
      logger.warn("git ls-files failed, attempting to initialize Git repository", {
        exitCode: response.exitCode,
        result: response.result,
      });
      
      // Try to initialize Git repository
      const initResult = await initializeGitRepository(executor, isWindows);
      
      if (initResult.success) {
        // Retry git ls-files after initialization
        const retryResponse = await executor.executeCommand({
          command,
          timeout: TIMEOUT_SEC,
        });
        
        if (retryResponse.exitCode === 0) {
          // Format the output if on Windows
          if (isWindows && retryResponse.result) {
            const files = retryResponse.result.split('\n').filter(f => f.trim());
            const tree = formatFilesAsTree(files);
            return tree;
          }
          return retryResponse.result;
        }
      }
      
      // If Git initialization fails, try alternative approaches
      logger.warn("Git initialization failed, trying alternative file listing", {
        initResult,
      });
      
      // Try using find command as fallback
      const fallbackCommand = isWindows 
        ? `find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" | head -50`
        : `find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \\) | head -50`;
      
      const fallbackResponse = await executor.executeCommand({
        command: fallbackCommand,
        timeout: TIMEOUT_SEC,
      });
      
      if (fallbackResponse.exitCode === 0 && fallbackResponse.result) {
        const files = fallbackResponse.result.split('\n').filter(f => f.trim());
        const tree = formatFilesAsTree(files);
        return tree;
      }
      
      // If all else fails, return a simple directory structure
      logger.warn("All file listing methods failed, returning basic structure");
      return "Local project directory\n├── (File listing unavailable)\n└── (Using local mode)";
    }

    // Format the output if on Windows (simple file list to tree-like structure)
    if (isWindows && response.result) {
      const files = response.result.split('\n').filter(f => f.trim());
      const tree = formatFilesAsTree(files);
      return tree;
    }

    return response.result;
  } catch (e) {
    logger.error("Failed to generate tree in local mode", {
      ...(e instanceof Error
        ? {
            name: e.name,
            message: e.message,
            stack: e.stack,
          }
        : { error: e }),
    });
    // Return a fallback message instead of throwing
    return "Local project directory\n├── (File listing unavailable)\n└── (Using local mode)";
  }
}

/**
 * Initialize Git repository automatically
 */
async function initializeGitRepository(executor: any, isWindows: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Check if we're in a Git repository
    const checkGitResult = await executor.executeCommand({
      command: 'git status',
      timeout: 10,
    });

    // If git status succeeds, we're already in a Git repository
    if (checkGitResult.exitCode === 0) {
      logger.debug("Already in a Git repository");
      return { success: true };
    }

    // Step 2: Initialize Git repository
    logger.info("Initializing Git repository");
    const initResult = await executor.executeCommand({
      command: 'git init',
      timeout: 10,
    });

    if (initResult.exitCode !== 0) {
      return { success: false, error: `Git init failed: ${initResult.result}` };
    }

    // Step 3: Configure Git user (required for commits)
    logger.info("Configuring Git user");
    const configUserResult = await executor.executeCommand({
      command: 'git config user.email "gptfy@gptfy.biz" && git config user.name "GPTfy"',
      timeout: 10,
    });

    if (configUserResult.exitCode !== 0) {
      logger.warn("Git user configuration failed, but continuing", {
        error: configUserResult.result,
      });
    }

    // Step 4: Add all files to Git
    logger.info("Adding files to Git repository");
    const addResult = await executor.executeCommand({
      command: 'git add .',
      timeout: 30,
    });

    if (addResult.exitCode !== 0) {
      logger.warn("Git add failed, but continuing", {
        error: addResult.result,
      });
    }

    // Step 5: Create initial commit
    logger.info("Creating initial commit");
    const commitResult = await executor.executeCommand({
      command: 'git commit -m "Initial commit by GPTfy"',
      timeout: 30,
    });

    if (commitResult.exitCode !== 0) {
      logger.warn("Git commit failed, but repository is initialized", {
        error: commitResult.result,
      });
      // Even if commit fails, the repository is initialized and git ls-files should work
      return { success: true };
    }

    logger.info("Git repository initialized successfully");
    return { success: true };

  } catch (error) {
    logger.error("Git initialization failed", { error });
    return { success: false, error: String(error) };
  }
}
