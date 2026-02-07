import {
  assembleLevelContext,
  formatContextForPrompt,
} from "./contextAssembler";
import {
  createLevelInstance,
  submitLevelInstance,
} from "./levelInstanceManager";
import { attackPlaner } from "../agents/attack-planer";
import { attackContractAgent } from "../agents/attack-contract";
import { deployScriptAgent } from "../agents/deploy-script";
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
  instanceAddress?: string;
  deployScript?: string;
  execution?: {
    success: boolean;
    output?: string;
    errors?: string;
  };
  submitted?: boolean;
}

function extractSolidity(text: string): string {
  const match = text.match(/```(?:solidity)?\s*\n([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

function clearDir(dir: string): void {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
    }
  }
}

function compileSources(): {
  success: boolean;
  output?: string;
  errors?: string;
} {
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

function runForgeScript(): {
  success: boolean;
  output?: string;
  errors?: string;
} {
  try {
    const stdout = execSync(
      `forge script script/Attack.s.sol:AttackScript --broadcast --rpc-url ${CONFIG.RPC_URL} --private-key ${CONFIG.PLAYER_PRIVATE_KEY}`,
      {
        cwd: CONFIG.COMPILER_ENV_DIR,
        encoding: "utf-8",
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
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
  const context = assembleLevelContext(levelId);
  const contextString = formatContextForPrompt(context);
  console.log(
    `[Pipeline] Level: ${context.levelInfo.name} (ID: ${context.levelInfo.deployId})`,
  );
  console.log(`[Pipeline] Context:\n${contextString}`);

  // Step 1: Plan the attack
  console.log("[Pipeline] Planning attack...");
  const planner = attackPlaner();
  const planResult = await planner.invoke({ context: contextString });
  const plan =
    typeof planResult.content === "string"
      ? planResult.content
      : JSON.stringify(planResult.content);
  console.log("[Pipeline] Plan generated.");
  console.log(`[Pipeline] Plan:\n${plan}`);

  // Step 2: Generate attack contract
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
  console.log(`[Pipeline] Contract Code:\n${contractCode}`);

  // Step 3: Compile attack contract
  console.log("[Pipeline] Compiling attack contract...");
  clearDir(CONFIG.COMPILER_SRC_DIR);
  clearDir(path.join(CONFIG.COMPILER_ENV_DIR, "script"));
  fs.writeFileSync(
    path.join(CONFIG.COMPILER_SRC_DIR, "Contract.sol"),
    contractCode,
    "utf-8",
  );
  const compilation = compileSources();
  console.log(
    `[Pipeline] Compilation: ${compilation.success ? "SUCCESS" : "FAILED"}`,
  );

  if (!compilation.success) {
    return {
      levelName: context.levelInfo.name,
      levelId: context.levelInfo.deployId,
      plan,
      contractCode,
      compilation,
    };
  }

  // Step 4: Create level instance on-chain
  console.log("[Pipeline] Creating level instance...");
  const instanceAddress = await createLevelInstance(
    context.ethernautAddress,
    context.factoryAddress,
    context.levelInfo.deployFunds,
  );
  console.log(`[Pipeline] Instance created at: ${instanceAddress}`);

  // Step 5: Generate deploy script
  console.log("[Pipeline] Generating deploy script...");
  const scriptGen = deployScriptAgent();
  const scriptResult = await scriptGen.invoke({
    context: contextString,
    plan,
    contractCode,
    instanceAddress,
  });
  const rawScript =
    typeof scriptResult.content === "string"
      ? scriptResult.content
      : JSON.stringify(scriptResult.content);
  const deployScript = extractSolidity(rawScript);
  console.log("[Pipeline] Deploy script generated.");
  console.log(`[Pipeline] Deploy Script:\n${deployScript}`);

  // Step 6: Write script and recompile
  console.log("[Pipeline] Compiling deploy script...");
  fs.writeFileSync(
    path.join(CONFIG.COMPILER_ENV_DIR, "script", "Attack.s.sol"),
    deployScript,
    "utf-8",
  );
  const scriptCompilation = compileSources();
  if (!scriptCompilation.success) {
    console.log("[Pipeline] Script compilation FAILED.");
    return {
      levelName: context.levelInfo.name,
      levelId: context.levelInfo.deployId,
      plan,
      contractCode,
      compilation,
      instanceAddress,
      deployScript,
      execution: {
        success: false,
        errors: `Script compilation failed: ${scriptCompilation.errors}`,
      },
    };
  }

  // Step 7: Execute forge script
  console.log("[Pipeline] Executing deploy script...");
  const execution = runForgeScript();
  console.log(
    `[Pipeline] Execution: ${execution.success ? "SUCCESS" : "FAILED"}`,
  );
  if (execution.output) {
    console.log(`[Pipeline] Execution output:\n${execution.output}`);
  }

  // Step 8: Submit level instance for validation
  let submitted = false;
  if (execution.success) {
    console.log("[Pipeline] Submitting level instance...");
    submitted = await submitLevelInstance(
      context.ethernautAddress,
      instanceAddress,
    );
    console.log(`[Pipeline] Submission: ${submitted ? "SUCCESS" : "FAILED"}`);
  }

  return {
    levelName: context.levelInfo.name,
    levelId: context.levelInfo.deployId,
    plan,
    contractCode,
    compilation,
    instanceAddress,
    deployScript,
    execution,
    submitted,
  };
}
