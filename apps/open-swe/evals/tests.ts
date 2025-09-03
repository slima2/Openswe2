// TODO: Add ruff promise and the mypy promise to the tests.
import { Sandbox } from "@daytonaio/sdk";
import { createLogger, LogLevel } from "../src/utils/logger.js";
import {
  ExecOptions,
  RuffResult,
  RuffIssue,
  MyPyResult,
  TypeScriptResult,
  ESLintResult,
  BuildResult,
  DependencyResult,
} from "./open-swe-types.js";

const logger = createLogger(LogLevel.DEBUG, " Evaluation Tests");

/**
 * Run ruff check and return score, error, and issues
 */
export const runRuffLint = async (
  sandbox: Sandbox,
  args: ExecOptions,
): Promise<RuffResult> => {
  logger.info("Running ruff check...");

  try {
    const execution = await sandbox.process.executeCommand(
      args.command,
      args.workingDir,
      args.env,
      args.timeoutSec,
    );

    if (execution.exitCode === 0) {
      logger.info("Ruff analysis passed. No issues found.");
      return {
        ruffScore: 1,
        error: null,
        issues: [],
      };
    }

    try {
      const issues: RuffIssue[] = JSON.parse(execution.result);
      const issueCount = Array.isArray(issues) ? issues.length : 0;
      const ruffScore = issueCount === 0 ? 1 : 0;

      logger.info(`Ruff found ${issueCount} issues`, {
        score: ruffScore,
        issues: issues.slice(0, 3), // Log first 3 issues
      });

      return {
        ruffScore,
        error: null,
        issues,
      };
    } catch (parseError) {
      logger.warn(
        "Could not parse ruff JSON output. Setting Ruff score to 0.",
        {
          parseError,
          output: execution.result?.substring(0, 200) + "...",
        },
      );

      return {
        ruffScore: 0,
        error: parseError as Error,
        issues: [],
      };
    }
  } catch (error) {
    logger.error("Failed to run ruff check", { error });
    return {
      ruffScore: 0,
      error: error as Error,
      issues: [],
    };
/**
 * Run TypeScript compilation check and return score, error, and issues
 */
export const runTypeScriptCheck = async (
  sandbox: Sandbox,
  args: ExecOptions,
): Promise<TypeScriptResult> => {
  logger.info("Running TypeScript compilation check...");

  try {
    const execution = await sandbox.process.executeCommand(
      args.command,
      args.workingDir,
      args.env,
      args.timeoutSec,
    );

    if (execution.exitCode === 0) {
      logger.info("TypeScript compilation passed. No issues found.");
      return {
        tsScore: 1,
        error: null,
        issues: [],
      };
    }

    // Parse TypeScript errors
    const errorLines = execution.result
      .split("\n")
      .filter((line) => line.includes(": error:") || line.includes(": warning:"));

    const issueCount = errorLines.length;
    const tsScore = issueCount === 0 ? 1 : 0;

    logger.info(`TypeScript found ${issueCount} issues`, {
      score: tsScore,
      issues: errorLines.slice(0, 3),
    });

    return {
      tsScore,
      error: null,
      issues: errorLines,
    };
  } catch (error) {
    logger.error("Failed to run TypeScript check", { error });
    return {
      tsScore: 0,
      error: error as Error,
      issues: [],
    };
  }
};

/**
 * Run ESLint check and return score, error, and issues
 */
export const runESLintCheck = async (
  sandbox: Sandbox,
  args: ExecOptions,
): Promise<ESLintResult> => {
  logger.info("Running ESLint check...");

  try {
    const execution = await sandbox.process.executeCommand(
      args.command,
      args.workingDir,
      args.env,
      args.timeoutSec,
    );

    if (execution.exitCode === 0) {
      logger.info("ESLint analysis passed. No issues found.");
      return {
        eslintScore: 1,
        error: null,
        issues: [],
      };
    }

    // Parse ESLint output
    const errorLines = execution.result
      .split("\n")
      .filter((line) => line.includes("error") || line.includes("warning"));

    const issueCount = errorLines.length;
    const eslintScore = issueCount === 0 ? 1 : 0;

    logger.info(`ESLint found ${issueCount} issues`, {
      score: eslintScore,
      issues: errorLines.slice(0, 3),
    });

    return {
      eslintScore,
      error: null,
      issues: errorLines,
    };
  } catch (error) {
    logger.error("Failed to run ESLint check", { error });
    return {
      eslintScore: 0,
      error: error as Error,
      issues: [],
    };
  }
};

/**
 * Run npm build check and return score, error, and issues
 */
export const runNpmBuildCheck = async (
  sandbox: Sandbox,
  args: ExecOptions,
): Promise<BuildResult> => {
  logger.info("Running npm build check...");

  try {
    const execution = await sandbox.process.executeCommand(
      args.command,
      args.workingDir,
      args.env,
      args.timeoutSec,
    );

    if (execution.exitCode === 0) {
      logger.info("npm build passed. No issues found.");
      return {
        buildScore: 1,
        error: null,
        issues: [],
      };
    }

    // Parse build errors
    const errorLines = execution.result
      .split("\n")
      .filter((line) => line.includes("error") || line.includes("failed"));

    const issueCount = errorLines.length;
    const buildScore = issueCount === 0 ? 1 : 0;

    logger.info(`npm build found ${issueCount} issues`, {
      score: buildScore,
      issues: errorLines.slice(0, 3),
    });

    return {
      buildScore,
      error: null,
      issues: errorLines,
    };
  } catch (error) {
    logger.error("Failed to run npm build check", { error });
    return {
      buildScore: 0,
      error: error as Error,
      issues: [],
    };
  }
};

/**
 * Check for missing dependencies and return score, error, and issues
 */
export const checkMissingDependencies = async (
  sandbox: Sandbox,
  args: ExecOptions,
): Promise<DependencyResult> => {
  logger.info("Checking for missing dependencies...");

  try {
    // Check if package.json exists
    const packageJsonCheck = await sandbox.process.executeCommand(
      "test -f package.json && echo 'exists' || echo 'not_found'",
      args.workingDir,
      args.env,
      30,
    );

    if (packageJsonCheck.result?.includes("not_found")) {
      logger.warn("No package.json found, skipping dependency check");
      return {
        depScore: 1,
        error: null,
        issues: [],
      };
    }

    // Try to install dependencies to check for missing ones
    const installResult = await sandbox.process.executeCommand(
      "npm install",
      args.workingDir,
      args.env,
      args.timeoutSec,
    );

    if (installResult.exitCode === 0) {
      logger.info("All dependencies installed successfully.");
      return {
        depScore: 1,
        error: null,
        issues: [],
      };
    }

    // Parse missing dependency errors
    const errorLines = installResult.result
      .split("\n")
      .filter((line) => line.includes("not found") || line.includes("missing"));

    const issueCount = errorLines.length;
    const depScore = issueCount === 0 ? 1 : 0;

    logger.info(`Found ${issueCount} dependency issues`, {
      score: depScore,
      issues: errorLines.slice(0, 3),
    });

    return {
      depScore,
      error: null,
      issues: errorLines,
    };
  } catch (error) {
    logger.error("Failed to check dependencies", { error });
    return {
      depScore: 0,
      error: error as Error,
      issues: [],
    };
  }
};

/**
 * Run mypy check and return score, error, and issues
 */
export const runMyPyTypeCheck = async (
  sandbox: Sandbox,
  args: ExecOptions,
): Promise<MyPyResult> => {
  logger.info("Running mypy check...");
  try {
    const execution = await sandbox.process.executeCommand(
      args.command,
      args.workingDir,
      args.env,
      args.timeoutSec,
    );

    if (execution.exitCode === 0) {
      logger.info("Mypy analysis passed. No issues found.");
      return {
        mypyScore: 1,
        error: null,
        issues: [],
      };
    } else {
      // Filter for actual type problems: errors and warnings
      const errorLines = execution.result
        .split("\n")
        .filter(
          (line) => line.includes(": error:") || line.includes(": warning:"),
        );

      const issueCount = errorLines.length;
      const mypyScore = issueCount === 0 ? 1 : 0;

      logger.info(`Mypy found ${issueCount} issues`, {
        score: mypyScore,
        issues: errorLines.slice(0, 3),
      });

      return {
        mypyScore,
        error: null,
        issues: errorLines,
      };
    }
  } catch (error) {
    logger.error("Failed to run mypy check", { error });
    return {
      mypyScore: 0,
      error: error as Error,
      issues: [],
    };
  }
};
