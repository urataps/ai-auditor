import express from "express";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { CONFIG } from "./config";
import {
  assembleLevelContext,
  formatContextForPrompt,
} from "./services/contextAssembler";
import { createLevelInstance } from "./services/levelInstanceManager";
import { playLevel } from "./services/playerService";

dotenv.config();

const app = express();
app.use(express.json());

// GET /context/:levelId — returns the assembled context text for a level
app.get("/context/:levelId", (req, res) => {
  try {
    const context = assembleLevelContext(req.params.levelId);
    const formatted = formatContextForPrompt(context);
    res.json({
      levelName: context.levelInfo.name,
      levelId: context.levelInfo.deployId,
      difficulty: context.levelInfo.difficulty,
      factoryAddress: context.factoryAddress,
      ethernautAddress: context.ethernautAddress,
      playerAddress: context.playerAddress,
      contextText: formatted,
    });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

// POST /init-level/:levelId — creates a level instance on-chain via the factory
app.post("/init-level/:levelId", async (req, res) => {
  try {
    const context = assembleLevelContext(req.params.levelId);

    const instanceAddress = await createLevelInstance(
      context.ethernautAddress,
      context.factoryAddress,
      context.levelInfo.deployFunds
    );

    res.json({
      levelName: context.levelInfo.name,
      levelId: context.levelInfo.deployId,
      instanceAddress,
      factoryAddress: context.factoryAddress,
      ethernautAddress: context.ethernautAddress,
      playerAddress: context.playerAddress,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// POST /play-level/:levelId — runs the full ReAct agent to exploit a level
app.post("/play-level/:levelId", async (req, res) => {
  try {
    const result = await playLevel(req.params.levelId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// POST /compile — writes source code to compiler-env/src/Contract.sol and runs forge build
app.post("/compile", async (req, res) => {
  try {
    const { sourceCode } = req.body;
    if (!sourceCode || typeof sourceCode !== "string") {
      res.status(400).json({ error: "sourceCode (string) is required in the request body" });
      return;
    }

    // Clear the src directory so previous contracts don't interfere
    const srcDir = CONFIG.COMPILER_SRC_DIR;
    for (const file of fs.readdirSync(srcDir)) {
      fs.unlinkSync(path.join(srcDir, file));
    }

    // Write the source code as Contract.sol
    const contractPath = path.join(srcDir, "Contract.sol");
    fs.writeFileSync(contractPath, sourceCode, "utf-8");

    // Run forge build
    let stdout: string;
    try {
      stdout = execSync("forge build", {
        cwd: CONFIG.COMPILER_ENV_DIR,
        encoding: "utf-8",
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string };
      res.json({
        success: false,
        errors: execError.stderr || execError.stdout || String(error),
      });
      return;
    }

    res.json({
      success: true,
      output: stdout,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.listen(CONFIG.PORT, () => {
  console.log(`ai-auditor server running on http://localhost:${CONFIG.PORT}`);
});
