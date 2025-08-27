import { spawn } from "child_process";
import { LocalExecuteResponse } from "./types.js";
import { createLogger, LogLevel } from "../logger.js";

const logger = createLogger(LogLevel.INFO, "LocalShellExecutor");

export class LocalShellExecutor {
  private workingDirectory: string;

  constructor(workingDirectory: string = process.cwd()) {
    this.workingDirectory = workingDirectory;
    logger.info("LocalShellExecutor created", { workingDirectory });
  }

  async executeCommand(
    command: string,
    args?: {
      workdir?: string;
      env?: Record<string, string>;
      timeout?: number;
      localMode?: boolean;
    },
  ): Promise<LocalExecuteResponse> {
    const { workdir, env, timeout = 30, localMode = false } = args || {};
    const cwd = workdir || this.workingDirectory;
    const environment = { ...process.env, ...(env || {}) };

    logger.info("Executing command locally", { command, cwd, localMode });

    // In local mode, use spawn directly for better reliability
    if (localMode) {
      try {
        const cleanEnv = Object.fromEntries(
          Object.entries(environment).filter(([_, v]) => v !== undefined),
        ) as Record<string, string>;
        const result = await this.executeWithSpawn(
          command,
          cwd,
          cleanEnv,
          timeout,
        );
        return result;
      } catch (spawnError: any) {
        logger.error("Spawn execution failed in local mode", {
          command,
          error: spawnError.message,
        });

        return {
          exitCode: 1,
          result: spawnError.message,
          artifacts: {
            stdout: "",
            stderr: spawnError.message,
          },
        };
      }
    }

    // Non-local mode: throw error as this executor is for local mode only
    throw new Error("LocalShellExecutor is only for local mode operations");
  }

  private async executeWithSpawn(
    command: string,
    cwd: string,
    env: Record<string, string>,
    timeout: number,
  ): Promise<LocalExecuteResponse> {
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32';
      
      let stdout = "";
      let stderr = "";
      
      // Log platform detection for debugging
      logger.info(`Platform detection: ${process.platform}, isWindows: ${isWindows}`, { 
        command: command.substring(0, 50),
        cwd 
      });
      
      // Create child process based on platform
      const child = isWindows
        ? spawn('cmd.exe', ['/c', command], {
            cwd,
            env: { ...process.env, ...env },
            timeout: timeout * 1000,
            shell: false,
          })
        : spawn('/bin/sh', ['-c', command], {
            cwd,
            env: { ...process.env, ...env },
            timeout: timeout * 1000,
            shell: false,
          });

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        resolve({
          exitCode: code || 0,
          result: stdout,
          artifacts: {
            stdout,
            stderr,
          },
        });
      });

      child.on("error", (error) => {
        logger.error(`Failed to execute command: ${error.message}`, { command, cwd });
        reject(error);
      });
    });
  }

  getWorkingDirectory(): string {
    return this.workingDirectory;
  }

  setWorkingDirectory(directory: string): void {
    this.workingDirectory = directory;
    logger.info("Working directory changed", { workingDirectory: directory });
  }
}

let sharedExecutor: LocalShellExecutor | null = null;

export function getLocalShellExecutor(
  workingDirectory?: string,
): LocalShellExecutor {
  if (
    !sharedExecutor ||
    (workingDirectory &&
      sharedExecutor.getWorkingDirectory() !== workingDirectory)
  ) {
    sharedExecutor = new LocalShellExecutor(workingDirectory);
  }
  return sharedExecutor;
}
