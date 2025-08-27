import { spawn, execSync } from "child_process";
import { LocalExecuteResponse } from "./types.js";
import { createLogger, LogLevel } from "../logger.js";
import {
  convertDaytonaPathToLocal,
} from "@open-swe/shared/open-swe/local-mode";

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
    
    // Convert Daytona-style paths to local Windows paths if needed
    let cwd = workdir || this.workingDirectory;
    if (process.platform === 'win32' && cwd.startsWith('/home/daytona/')) {
      const match = cwd.match(/^\/home\/daytona\/([^\/]+)/);
      const projectName = match ? match[1] : 'default-project';
      cwd = convertDaytonaPathToLocal(cwd, projectName);
      logger.info(`Converted Daytona path to Windows path`, { 
        original: workdir, 
        converted: cwd 
      });
    }
    
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
      
      let spawnCommand: string;
      let spawnArgs: string[];
      let spawnOptions: any;
      
      if (isWindows) {
        // Check if WSL2 is available
        const wslAvailable = this.checkWSLAvailable();
        
        if (wslAvailable) {
          // Use WSL2 to execute Linux commands on Windows
          logger.info("Using WSL2 for command execution");
          
          // Convert Windows path to WSL path
          const wslPath = this.convertToWSLPath(cwd);
          
          // Create the command to run in WSL
          // We need to properly escape the command and handle quotes
          const escapedCommand = command.replace(/"/g, '\\"');
          const wslCommand = `cd "${wslPath}" && ${escapedCommand}`;
          
          spawnCommand = 'wsl';
          spawnArgs = ['bash', '-c', wslCommand];
          spawnOptions = {
            env: { ...process.env, ...env },
            timeout: timeout * 1000,
            windowsHide: true,
            shell: false, // Don't use shell when calling WSL directly
          };
        } else {
          // Fallback to regular Windows cmd if WSL is not available
          logger.warn("WSL2 not available, falling back to Windows cmd");
          spawnCommand = command;
          spawnArgs = [];
          spawnOptions = {
            cwd,
            env: { ...process.env, ...env },
            timeout: timeout * 1000,
            shell: true,
            windowsHide: true,
          };
        }
      } else {
        // Linux/Mac: use shell directly
        spawnCommand = command;
        spawnArgs = [];
        spawnOptions = {
          cwd,
          env: { ...process.env, ...env },
          timeout: timeout * 1000,
          shell: true,
        };
      }
      
      const child = spawn(spawnCommand, spawnArgs, spawnOptions);

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

  /**
   * Check if WSL2 is available on Windows
   */
  private checkWSLAvailable(): boolean {
    if (process.platform !== 'win32') {
      return false;
    }
    
    try {
      // Try to run a simple WSL command to check if it's available
      execSync('wsl --status', { stdio: 'ignore' });
      return true;
    } catch (error) {
      logger.warn("WSL2 is not available or not installed");
      return false;
    }
  }
  
  /**
   * Convert Windows path to WSL path
   * C:\Users\user\project -> /mnt/c/Users/user/project
   */
  private convertToWSLPath(windowsPath: string): string {
    if (!windowsPath || process.platform !== 'win32') {
      return windowsPath;
    }
    
    // Handle UNC paths or already converted paths
    if (windowsPath.startsWith('//') || windowsPath.startsWith('/mnt/')) {
      return windowsPath;
    }
    
    // Convert Windows path to WSL path
    // C:\Users\... -> /mnt/c/Users/...
    const normalized = windowsPath.replace(/\\/g, '/');
    
    // Check if it's an absolute Windows path (e.g., C:/Users/...)
    const match = normalized.match(/^([a-zA-Z]):\/(.*)/);
    if (match) {
      const drive = match[1].toLowerCase();
      const path = match[2];
      return `/mnt/${drive}/${path}`;
    }
    
    // If it's not an absolute Windows path, return as-is
    return normalized;
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