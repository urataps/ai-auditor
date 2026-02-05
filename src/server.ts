import express from "express";
import dotenv from "dotenv";
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

app.listen(CONFIG.PORT, () => {
  console.log(`ai-auditor server running on http://localhost:${CONFIG.PORT}`);
});
