import {
  assembleLevelContext,
  formatContextForPrompt,
} from "./contextAssembler";
import {
  createLevelInstance,
  submitLevelInstance,
} from "./levelInstanceManager";
import { runLevelPlayer } from "../agents/level-player";

export interface PlayResult {
  levelName: string;
  levelId: string;
  instanceAddress: string;
  agentOutput: string;
  intermediateSteps: unknown[];
  success: boolean;
}

export async function playLevel(levelId: string): Promise<PlayResult> {
  // Step 1: Assemble context
  const context = assembleLevelContext(levelId);
  console.log(
    `[PlayerService] Playing level: ${context.levelInfo.name} (ID: ${context.levelInfo.deployId})`
  );

  // Step 2: Create level instance on Anvil
  console.log("[PlayerService] Creating level instance...");
  const instanceAddress = await createLevelInstance(
    context.ethernautAddress,
    context.factoryAddress,
    context.levelInfo.deployFunds
  );
  context.instanceAddress = instanceAddress;
  console.log(`[PlayerService] Instance created at: ${instanceAddress}`);

  // Step 3: Format context and run agent
  const contextString = formatContextForPrompt(context);
  console.log("[PlayerService] Starting ReAct agent...");

  const result = await runLevelPlayer(
    contextString,
    context.levelInfo.name,
    instanceAddress,
    context.playerAddress
  );

  console.log("[PlayerService] Agent finished. Submitting level instance...");

  // Step 4: Submit the level instance for validation
  const success = await submitLevelInstance(
    context.ethernautAddress,
    instanceAddress
  );

  console.log(
    `[PlayerService] Result: ${success ? "SUCCESS" : "FAILURE"}`
  );

  return {
    levelName: context.levelInfo.name,
    levelId: context.levelInfo.deployId,
    instanceAddress,
    agentOutput: result.output,
    intermediateSteps: result.intermediateSteps,
    success,
  };
}
