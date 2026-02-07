import {
  assembleLevelContext,
  formatContextForPrompt,
} from "./contextAssembler";
import { attackPlaner } from "../agents/attack-planer";
import { attackContractAgent } from "../agents/attack-contract";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { CONFIG } from "../config";

export interface PlayResult {
  levelName: string;
  levelId: string;
  plan: string;
  contractCode: string;
  compilation: {
    success: boolean;
    output?: string;
    errors?: string;
  };
}

function extractSolidity(text: string): string {
  const match = text.match(/```(?:solidity)?\s*\n([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

function compileContract(sourceCode: string): {
  success: boolean;
  output?: string;
  errors?: string;
} {
  const srcDir = CONFIG.COMPILER_SRC_DIR;

  // Clear src directory
  for (const file of fs.readdirSync(srcDir)) {
    fs.unlinkSync(path.join(srcDir, file));
  }

  // Write Contract.sol
  fs.writeFileSync(path.join(srcDir, "Contract.sol"), sourceCode, "utf-8");

  // Run forge build
  try {
    const stdout = execSync("forge build", {
      cwd: CONFIG.COMPILER_ENV_DIR,
      encoding: "utf-8",
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { success: true, output: stdout };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string };
    return {
      success: false,
      errors: execError.stderr || execError.stdout || String(error),
    };
  }
}

export async function playLevel(levelId: string): Promise<PlayResult> {
  // Step 1: Assemble context
  const context = assembleLevelContext(levelId);
  const contextString = formatContextForPrompt(context);
  console.log(
    `[Pipeline] Level: ${context.levelInfo.name} (ID: ${context.levelInfo.deployId})`
  );

  // Step 2: Plan the attack
  console.log("[Pipeline] Planning attack...");
  const planner = attackPlaner();
  const planResult = await planner.invoke({ context: contextString });
  const plan =
    typeof planResult.content === "string"
      ? planResult.content
      : JSON.stringify(planResult.content);
  console.log("[Pipeline] Plan generated.");

  // Step 3: Generate attack contract
  console.log("[Pipeline] Generating attack contract...");
  const generator = attackContractAgent();
  const contractResult = await generator.invoke({
    context: contextString,
    plan,
  });
  const rawCode =
    typeof contractResult.content === "string"
      ? contractResult.content
      : JSON.stringify(contractResult.content);
  const contractCode = extractSolidity(rawCode);
  console.log("[Pipeline] Contract generated.");

  // Step 4: Compile
  console.log("[Pipeline] Compiling...");
  const compilation = compileContract(contractCode);
  console.log(
    `[Pipeline] Compilation: ${compilation.success ? "SUCCESS" : "FAILED"}`
  );

  return {
    levelName: context.levelInfo.name,
    levelId: context.levelInfo.deployId,
    plan,
    contractCode,
    compilation,
  };
}
