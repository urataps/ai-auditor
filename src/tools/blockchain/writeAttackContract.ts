import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { CONFIG } from "../../config";

export const writeAttackContractTool = tool(
  async ({ filename, sourceCode }): Promise<string> => {
    try {
      if (!filename.endsWith(".sol")) {
        filename = `${filename}.sol`;
      }

      const filePath = path.join(CONFIG.ATTACKS_DIR, filename);

      // Ensure attacks directory exists
      if (!fs.existsSync(CONFIG.ATTACKS_DIR)) {
        fs.mkdirSync(CONFIG.ATTACKS_DIR, { recursive: true });
      }

      fs.writeFileSync(filePath, sourceCode, "utf-8");

      return JSON.stringify({
        success: true,
        filePath,
        filename,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Failed to write attack contract: ${error}`,
      });
    }
  },
  {
    name: "write_attack_contract",
    description:
      'Writes a Solidity attack contract to the ethernaut/contracts/src/attacks/ directory. The contract can import target level contracts and OpenZeppelin libraries. Always provide complete valid Solidity source code including pragma and imports.',
    schema: z.object({
      filename: z
        .string()
        .describe('Filename for the contract (e.g., "MyAttack.sol")'),
      sourceCode: z
        .string()
        .describe("Complete Solidity source code for the attack contract"),
    }),
  }
);
