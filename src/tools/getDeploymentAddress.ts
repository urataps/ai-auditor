import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const DEPLOY_LOCAL_PATH = path.join(__dirname, '../game-data/ethernaut/deploy.local.json');

interface DeploymentData {
  [key: string]: string;
  ethernaut: string;
  implementation: string;
  proxyAdmin: string;
  proxyStats: string;
}

function loadDeployment(): DeploymentData {
  const data = fs.readFileSync(DEPLOY_LOCAL_PATH, 'utf-8');
  return JSON.parse(data);
}

export const getDeploymentAddressTool = tool(
  async ({ levelId }): Promise<string> => {
    try {
      const deployment = loadDeployment();

      // Handle special keys
      if (['ethernaut', 'implementation', 'proxyAdmin', 'proxyStats'].includes(levelId)) {
        return JSON.stringify({
          key: levelId,
          address: deployment[levelId]
        });
      }

      // Numeric level ID
      const address = deployment[levelId];
      if (!address) {
        return JSON.stringify({
          error: `No deployment found for level ID: ${levelId}`,
          availableIds: Object.keys(deployment).filter(k => !isNaN(Number(k)))
        });
      }

      return JSON.stringify({
        levelId: levelId,
        factoryAddress: address
      });
    } catch (error) {
      return JSON.stringify({ error: `Failed to load deployment: ${error}` });
    }
  },
  {
    name: 'get_deployment_address',
    description: 'Gets the deployed contract address for an Ethernaut level factory or system contract (ethernaut, implementation, proxyAdmin, proxyStats).',
    schema: z.object({
      levelId: z.string().describe('The level ID (e.g., "1") or system contract name (e.g., "ethernaut")')
    })
  }
);

export const getAllDeploymentsTool = tool(
  async (): Promise<string> => {
    try {
      const deployment = loadDeployment();

      const levels: { [key: string]: string } = {};
      const system: { [key: string]: string } = {};

      for (const [key, value] of Object.entries(deployment)) {
        if (isNaN(Number(key))) {
          system[key] = value;
        } else {
          levels[key] = value;
        }
      }

      return JSON.stringify({ levels, system }, null, 2);
    } catch (error) {
      return JSON.stringify({ error: `Failed to load deployments: ${error}` });
    }
  },
  {
    name: 'get_all_deployments',
    description: 'Returns all deployed Ethernaut contract addresses for the local network, grouped by level factories and system contracts.',
    schema: z.object({})
  }
);
