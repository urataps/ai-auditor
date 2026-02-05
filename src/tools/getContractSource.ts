import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const CONTRACTS_PATH = path.join(__dirname, '../game-data/ethernaut/contracts');

export const getContractSourceTool = tool(
  async ({ contractName }): Promise<string> => {
    try {
      // Normalize contract name - add .sol if not present
      let filename = contractName;
      if (!filename.endsWith('.sol')) {
        filename = `${filename}.sol`;
      }

      const filePath = path.join(CONTRACTS_PATH, filename);

      if (!fs.existsSync(filePath)) {
        // List available contracts
        const available = fs.readdirSync(CONTRACTS_PATH)
          .filter(f => f.endsWith('.sol'))
          .map(f => f.replace('.sol', ''));

        return JSON.stringify({
          error: `Contract not found: ${contractName}`,
          availableContracts: available
        });
      }

      const source = fs.readFileSync(filePath, 'utf-8');
      return JSON.stringify({
        contractName: filename,
        source: source
      });
    } catch (error) {
      return JSON.stringify({ error: `Failed to load contract: ${error}` });
    }
  },
  {
    name: 'get_contract_source',
    description: 'Retrieves the Solidity source code for an Ethernaut contract. Provide the contract name (e.g., "Fallback" or "FallbackFactory").',
    schema: z.object({
      contractName: z.string().describe('The contract name (e.g., "Fallback", "FallbackFactory.sol")')
    })
  }
);

export const getLevelContractsTool = tool(
  async ({ levelName }): Promise<string> => {
    try {
      // Get both instance and factory contracts for a level
      const instancePath = path.join(CONTRACTS_PATH, `${levelName}.sol`);
      const factoryPath = path.join(CONTRACTS_PATH, `${levelName}Factory.sol`);

      const result: { instance?: string; factory?: string; errors?: string[] } = {};
      const errors: string[] = [];

      if (fs.existsSync(instancePath)) {
        result.instance = fs.readFileSync(instancePath, 'utf-8');
      } else {
        errors.push(`Instance contract not found: ${levelName}.sol`);
      }

      if (fs.existsSync(factoryPath)) {
        result.factory = fs.readFileSync(factoryPath, 'utf-8');
      } else {
        errors.push(`Factory contract not found: ${levelName}Factory.sol`);
      }

      if (errors.length > 0) {
        result.errors = errors;
      }

      if (!result.instance && !result.factory) {
        const available = fs.readdirSync(CONTRACTS_PATH)
          .filter(f => f.endsWith('.sol') && !f.includes('Factory'))
          .map(f => f.replace('.sol', ''));
        return JSON.stringify({
          error: `No contracts found for level: ${levelName}`,
          availableLevels: available
        });
      }

      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({ error: `Failed to load level contracts: ${error}` });
    }
  },
  {
    name: 'get_level_contracts',
    description: 'Retrieves both the instance contract and factory contract source code for an Ethernaut level.',
    schema: z.object({
      levelName: z.string().describe('The level name (e.g., "Fallback", "Delegation")')
    })
  }
);
