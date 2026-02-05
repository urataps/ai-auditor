import * as fs from "fs";
import * as path from "path";
import { CONFIG } from "../config";
import type { LevelInfo } from "../tools/getLevelInfo";

interface DeploymentData {
  [key: string]: string;
}

export interface LevelContext {
  levelInfo: LevelInfo;
  instanceSource: string;
  factorySource: string;
  docs: string;
  factoryAddress: string;
  ethernautAddress: string;
  instanceAddress: string;
  playerAddress: string;
}

function loadGameData(): { levels: LevelInfo[] } {
  return JSON.parse(fs.readFileSync(CONFIG.GAMEDATA_PATH, "utf-8"));
}

function loadDeployment(): DeploymentData {
  return JSON.parse(fs.readFileSync(CONFIG.DEPLOY_LOCAL_PATH, "utf-8"));
}

function findLevelInfo(levelId: string): LevelInfo {
  const gameData = loadGameData();

  let level: LevelInfo | undefined;
  if (!isNaN(Number(levelId))) {
    level = gameData.levels.find((l) => l.deployId === levelId);
  }
  if (!level) {
    level = gameData.levels.find(
      (l) => l.name.toLowerCase() === levelId.toLowerCase()
    );
  }
  if (!level) {
    const available = gameData.levels.map((l) => `${l.deployId}: ${l.name}`);
    throw new Error(
      `Level not found: ${levelId}. Available: ${available.join(", ")}`
    );
  }
  return level;
}

function readContractSource(contractFilename: string): string {
  let filename = contractFilename;
  if (!filename.endsWith(".sol")) {
    filename = `${filename}.sol`;
  }
  const filePath = path.join(CONFIG.CONTRACTS_SOURCE_PATH, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Contract source not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf-8");
}

function readLevelDocs(levelName: string): string {
  const normalizedName = levelName.toLowerCase().replace(/\s+/g, "");

  // Handle special naming cases
  const possibleNames = [
    normalizedName,
    levelName === "Delegation" ? "delegate" : normalizedName,
    levelName === "Re-entrancy" || levelName === "Reentrance"
      ? "reentrancy"
      : normalizedName,
  ];

  for (const name of possibleNames) {
    const docPath = path.join(CONFIG.DOCS_PATH, `${name}.md`);
    if (fs.existsSync(docPath)) {
      return fs.readFileSync(docPath, "utf-8");
    }
  }

  return "(No documentation found for this level)";
}

export function assembleLevelContext(levelId: string): LevelContext {
  const levelInfo = findLevelInfo(levelId);
  const deployment = loadDeployment();

  const instanceSource = readContractSource(levelInfo.instanceContract);
  const factorySource = readContractSource(levelInfo.levelContract);
  const docs = readLevelDocs(levelInfo.name);

  const factoryAddress = deployment[levelInfo.deployId];
  if (!factoryAddress) {
    throw new Error(
      `No deployment address for level ${levelInfo.deployId} (${levelInfo.name})`
    );
  }

  const ethernautAddress = deployment["ethernaut"];
  if (!ethernautAddress) {
    throw new Error("Ethernaut contract address not found in deployment");
  }

  return {
    levelInfo,
    instanceSource,
    factorySource,
    docs,
    factoryAddress,
    ethernautAddress,
    instanceAddress: "", // set after instance creation
    playerAddress: CONFIG.PLAYER_ADDRESS,
  };
}

export function formatContextForPrompt(ctx: LevelContext): string {
  return `=== ETHERNAUT LEVEL: ${ctx.levelInfo.name} (Difficulty: ${ctx.levelInfo.difficulty}/10) ===

== OBJECTIVE ==
${ctx.docs}

== TARGET CONTRACT SOURCE (${ctx.levelInfo.instanceContract}) ==
\`\`\`solidity
${ctx.instanceSource}
\`\`\`

== FACTORY CONTRACT SOURCE (${ctx.levelInfo.levelContract}) ==
The factory's validateInstance function defines the win condition.
\`\`\`solidity
${ctx.factorySource}
\`\`\`

== DEPLOYMENT INFO ==
- Ethernaut Contract: ${ctx.ethernautAddress}
- Factory Address: ${ctx.factoryAddress}
- Level Instance Address: ${ctx.instanceAddress}
- Player Address (your EOA): ${ctx.playerAddress}
- Deploy Funds sent: ${ctx.levelInfo.deployFunds} ETH

== AVAILABLE IMPORTS ==
Your attack contract is placed in ethernaut/contracts/src/attacks/ and can import:
- "../levels/${ctx.levelInfo.instanceContract}" for the target contract interface
- "forge-std/..." for forge standard library
- "openzeppelin-contracts-08/..." for OpenZeppelin v0.8 contracts

NOTE: If the target uses an older Solidity version, define an inline interface rather than importing directly.`;
}
