import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const DOCS_PATH = path.join(__dirname, '../game-data/ethernaut/docs');

export const getLevelDocsTool = tool(
  async ({ levelName, includeComplete = false }): Promise<string> => {
    try {
      // Normalize level name to lowercase for doc files
      const normalizedName = levelName.toLowerCase().replace(/\s+/g, '');

      // Try different naming conventions
      const possibleNames = [
        normalizedName,
        normalizedName.replace('gatekeeper', 'gatekeeper'),
        // Handle special cases
        levelName === 'Delegation' ? 'delegate' : normalizedName,
        levelName === 'Re-entrancy' || levelName === 'Reentrance' ? 'reentrancy' : normalizedName,
      ];

      let descPath: string | null = null;
      let completePath: string | null = null;

      for (const name of possibleNames) {
        const testDescPath = path.join(DOCS_PATH, `${name}.md`);
        if (fs.existsSync(testDescPath)) {
          descPath = testDescPath;
          completePath = path.join(DOCS_PATH, `${name}_complete.md`);
          break;
        }
      }

      if (!descPath) {
        const available = fs.readdirSync(DOCS_PATH)
          .filter(f => f.endsWith('.md') && !f.includes('_complete'))
          .map(f => f.replace('.md', ''));
        return JSON.stringify({
          error: `Documentation not found for: ${levelName}`,
          availableDocs: available
        });
      }

      const result: { description: string; completionHints?: string } = {
        description: fs.readFileSync(descPath, 'utf-8')
      };

      if (includeComplete && completePath && fs.existsSync(completePath)) {
        result.completionHints = fs.readFileSync(completePath, 'utf-8');
      }

      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({ error: `Failed to load docs: ${error}` });
    }
  },
  {
    name: 'get_level_docs',
    description: 'Retrieves documentation and hints for an Ethernaut level. Optionally includes completion hints that explain the vulnerability.',
    schema: z.object({
      levelName: z.string().describe('The level name (e.g., "Fallback", "Delegation")'),
      includeComplete: z.boolean().optional().describe('Whether to include completion hints (default: false)')
    })
  }
);
