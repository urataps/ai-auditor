import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const GAME_DATA_PATH = path.join(__dirname, '../game-data/ethernaut/gamedata.json');

export interface LevelInfo {
  name: string;
  created: string;
  difficulty: string;
  description: string;
  completedDescription: string;
  levelContract: string;
  instanceContract: string;
  revealCode: boolean;
  deployParams: unknown[];
  deployFunds: number;
  deployId: string;
  instanceGas: number;
  author: string;
}

interface GameData {
  levels: LevelInfo[];
}

function loadGameData(): GameData {
  const data = fs.readFileSync(GAME_DATA_PATH, 'utf-8');
  return JSON.parse(data);
}

export const getLevelInfoTool = tool(
  async ({ levelId }): Promise<string> => {
    try {
      const gameData = loadGameData();

      // levelId can be a number (deployId) or a name
      let level: LevelInfo | undefined;

      if (!isNaN(Number(levelId))) {
        level = gameData.levels.find(l => l.deployId === levelId);
      }

      if (!level) {
        level = gameData.levels.find(
          l => l.name.toLowerCase() === levelId.toLowerCase()
        );
      }

      if (!level) {
        return JSON.stringify({
          error: `Level not found: ${levelId}`,
          availableLevels: gameData.levels.map(l => ({ id: l.deployId, name: l.name }))
        });
      }

      return JSON.stringify(level, null, 2);
    } catch (error) {
      return JSON.stringify({ error: `Failed to load level info: ${error}` });
    }
  },
  {
    name: 'get_level_info',
    description: 'Retrieves metadata for an Ethernaut level including name, difficulty, contract names, and configuration. Use level ID (0-40) or level name.',
    schema: z.object({
      levelId: z.string().describe('The level ID (e.g., "1") or level name (e.g., "Fallback")')
    })
  }
);

export const listAllLevelsTool = tool(
  async (): Promise<string> => {
    try {
      const gameData = loadGameData();
      const summary = gameData.levels.map(l => ({
        id: l.deployId,
        name: l.name,
        difficulty: l.difficulty,
        instanceContract: l.instanceContract
      }));
      return JSON.stringify(summary, null, 2);
    } catch (error) {
      return JSON.stringify({ error: `Failed to list levels: ${error}` });
    }
  },
  {
    name: 'list_all_levels',
    description: 'Lists all available Ethernaut levels with their IDs, names, and difficulty ratings.',
    schema: z.object({})
  }
);
