import "dotenv/config";
import { OpenSWEInput, CodeTestDetails } from "./open-swe-types.js";
import { Daytona, Sandbox } from "@daytonaio/sdk";
import { createLogger, LogLevel } from "../src/utils/logger.js";
import { TIMEOUT_SEC } from "@open-swe/shared/constants";
import { DEFAULT_SANDBOX_CREATE_PARAMS } from "../src/constants.js";
import { TargetRepository } from "@open-swe/shared/open-swe/types";
import { cloneRepo } from "../src/utils/github/git.js";
import { getRepoAbsolutePath } from "@open-swe/shared/git";
import { SimpleEvaluationResult } from "langsmith/vitest";
import { runRuffLint, runMyPyTypeCheck, runTypeScriptCheck, runESLintCheck, runNpmBuildCheck, checkMissingDependencies } from "./tests.js";
import { setupEnv, ENV_CONSTANTS } from "../src/utils/env-setup.js";

const logger = createLogger(LogLevel.INFO, "Evaluator ");

// Use shared constants from env-setup utility
const { RUN_PYTHON_IN_VENV } = ENV_CONSTANTS;

/**
 * Runs comprehensive code analysis on the repository (Python + JavaScript/TypeScript)
 */
async function runCodeTests(
  sandbox: Sandbox,
  absoluteRepoDir: string,
): Promise<{ 
  ruffScore: number; 
  mypyScore: number; 
  tsScore: number;
  eslintScore: number;
  buildScore: number;
  depScore: number;
  details: CodeTestDetails 
}> {
  logger.info("Running comprehensive code analysis on repository");

  const testResults: {
    ruffScore: number;
    mypyScore: number;
    tsScore: number;
    eslintScore: number;
    buildScore: number;
    depScore: number;
    details: CodeTestDetails;
  } = {
    ruffScore: 0,
    mypyScore: 0,
    tsScore: 0,
    eslintScore: 0,
    buildScore: 0,
    depScore: 0,
    details: {
      ruff: {
        issues: [],
        error: null,
      },
      mypy: {
        issues: [],
        error: null,
      },
      typescript: {
        issues: [],
        error: null,
      },
      eslint: {
        issues: [],
        error: null,
      },
      build: {
        issues: [],
        error: null,
      },
      dependencies: {
        issues: [],
        error: null,
      },
    },
  };

  // Check if package.json exists to determine if this is a JS/TS project
  const packageJsonCheck = await sandbox.process.executeCommand(
    "test -f package.json && echo 'exists' || echo 'not_found'",
    absoluteRepoDir,
    undefined,
    30,
  );

  const isJSProject = packageJsonCheck.result?.includes("exists");

  if (isJSProject) {
    logger.info("Detected JavaScript/TypeScript project, running JS/TS validations...");
    
    // Install dependencies first
    await sandbox.process.executeCommand(
      "npm install",
      absoluteRepoDir,
      undefined,
      TIMEOUT_SEC * 2,
    );

    // Run JS/TS validations in parallel
    const [tsCheck, eslintCheck, buildCheck, depsCheck] = await Promise.all([
      runTypeScriptCheck(sandbox, {
        command: "npx tsc --noEmit",
        workingDir: absoluteRepoDir,
        env: undefined,
        timeoutSec: TIMEOUT_SEC,
      }),
      runESLintCheck(sandbox, {
        command: "npm run lint || npx eslint . --ext .ts,.tsx,.js,.jsx",
        workingDir: absoluteRepoDir,
        env: undefined,
        timeoutSec: TIMEOUT_SEC,
      }),
      runNpmBuildCheck(sandbox, {
        command: "npm run build",
        workingDir: absoluteRepoDir,
        env: undefined,
        timeoutSec: TIMEOUT_SEC * 2,
      }),
      checkMissingDependencies(sandbox, {
        command: "echo 'dependency check'",
        workingDir: absoluteRepoDir,
        env: undefined,
        timeoutSec: TIMEOUT_SEC,
      }),
    ]);

    // Update JS/TS results
    Object.assign(testResults, {
      tsScore: tsCheck.tsScore,
      eslintScore: eslintCheck.eslintScore,
      buildScore: buildCheck.buildScore,
      depScore: depsCheck.depScore,
      details: {
        ...testResults.details,
        typescript: {
          issues: tsCheck.issues,
          error: tsCheck.error,
        },
        eslint: {
          issues: eslintCheck.issues,
          error: eslintCheck.error,
        },
        build: {
          issues: buildCheck.issues,
          error: buildCheck.error,
        },
        dependencies: {
          issues: depsCheck.issues,
          error: depsCheck.error,
        },
      },
    });
  }

  // Always run Python validations
  const [ruffLint, mypyCheck] = await Promise.all([
    runRuffLint(sandbox, {
      command: `${RUN_PYTHON_IN_VENV} -m ruff check . --output-format=json`,
      workingDir: absoluteRepoDir,
      env: undefined,
      timeoutSec: TIMEOUT_SEC * 3,
    }),
    runMyPyTypeCheck(sandbox, {
      command: `${RUN_PYTHON_IN_VENV} -m mypy . --no-error-summary --show-error-codes --no-color-output`,
      workingDir: absoluteRepoDir,
      env: undefined,
      timeoutSec: TIMEOUT_SEC * 3,
    }),
  ]);

  // Update Python results
  Object.assign(testResults, {
    ruffScore: ruffLint.ruffScore,
    mypyScore: mypyCheck.mypyScore,
    details: {
      ...testResults.details,
      ruff: {
        issues: ruffLint.issues,
        error: ruffLint.error,
      },
      mypy: {
        issues: mypyCheck.issues,
        error: mypyCheck.error,
      },
    },
  });

  logger.info("Code tests completed", {
    ruffScore: testResults.ruffScore,
    mypyScore: testResults.mypyScore,
    tsScore: testResults.tsScore,
    eslintScore: testResults.eslintScore,
    buildScore: testResults.buildScore,
    depScore: testResults.depScore,
    ruffIssues: testResults.details.ruff.issues.length,
    mypyIssues: testResults.details.mypy.issues.length,
    tsIssues: testResults.details.typescript.issues.length,
    eslintIssues: testResults.details.eslint.issues.length,
    buildIssues: testResults.details.build.issues.length,
    depsIssues: testResults.details.dependencies.issues.length,
  });

  return testResults;
}

/**
 * Main evaluator function for OpenSWE code analysis
 */
export async function evaluator(inputs: {
  openSWEInputs: OpenSWEInput;
  output: {
    branchName: string;
    targetRepository: TargetRepository;
  };
}): Promise<SimpleEvaluationResult[]> {
  const { openSWEInputs, output } = inputs;

  const githubToken = process.env.GITHUB_PAT;
  if (!githubToken) {
    throw new Error("GITHUB_PAT environment variable is not set");
  }

  const daytonaInstance = new Daytona();
  const solutionBranch = output.branchName;
  logger.info("Creating sandbox...", {
    repo: openSWEInputs.repo,
    originalBranch: openSWEInputs.branch,
    solutionBranch,
    user_input: openSWEInputs.user_input.substring(0, 100) + "...",
  });

  const sandbox = await daytonaInstance.create(DEFAULT_SANDBOX_CREATE_PARAMS);

  try {
    await cloneRepo(sandbox, output.targetRepository, {
      githubInstallationToken: githubToken,
      stateBranchName: solutionBranch,
    });

    const absoluteRepoDir = getRepoAbsolutePath(output.targetRepository);

    const envSetupSuccess = await setupEnv(sandbox, absoluteRepoDir);
    if (!envSetupSuccess) {
      logger.error("Failed to setup environment");
      return [
        {
          key: "overall-score",
          score: 0,
        },
      ];
    }

    const analysisResult = await runCodeTests(sandbox, absoluteRepoDir);

    const overallScore = analysisResult.ruffScore + analysisResult.mypyScore + 
                         analysisResult.tsScore + analysisResult.eslintScore + 
                         analysisResult.buildScore + analysisResult.depScore;

    logger.info("Evaluation completed", {
      overallScore,
      ruffScore: analysisResult.ruffScore,
      mypyScore: analysisResult.mypyScore,
      tsScore: analysisResult.tsScore,
      eslintScore: analysisResult.eslintScore,
      buildScore: analysisResult.buildScore,
      depScore: analysisResult.depScore,
      repo: openSWEInputs.repo,
      originalBranch: openSWEInputs.branch,
      solutionBranch,
    });

    return [
      {
        key: "overall-score",
        score: overallScore,
      },
      {
        key: "ruff-score",
        score: analysisResult.ruffScore,
      },
      {
        key: "mypy-score",
        score: analysisResult.mypyScore,
      },
      {
        key: "typescript-score",
        score: analysisResult.tsScore,
      },
      {
        key: "eslint-score",
        score: analysisResult.eslintScore,
      },
      {
        key: "build-score",
        score: analysisResult.buildScore,
      },
      {
        key: "dependency-score",
        score: analysisResult.depScore,
      },
    ];
  } catch (error) {
    logger.error("Evaluation failed with error", { error });
    return [
      {
        key: "overall-score",
        score: 0,
      },
    ];
  } finally {
    try {
      await sandbox.delete();
      logger.info("Sandbox cleaned up successfully");
    } catch (cleanupError) {
      logger.error("Failed to cleanup sandbox", { cleanupError });
    }
  }
}
