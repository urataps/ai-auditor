import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ethers } from "ethers";
import { CONFIG } from "../../config";

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(CONFIG.RPC_URL);
}

export const readBlockchainTool = tool(
  async ({ operation, address, functionSig, args, slot }): Promise<string> => {
    try {
      const provider = getProvider();

      if (operation === "balance") {
        const balance = await provider.getBalance(address);
        return JSON.stringify({
          address,
          balance: balance.toString(),
          balanceEth: ethers.formatEther(balance),
        });
      }

      if (operation === "storage") {
        if (!slot) {
          return JSON.stringify({ error: "slot is required for storage reads" });
        }
        const value = await provider.getStorage(address, slot);
        return JSON.stringify({
          address,
          slot,
          value,
        });
      }

      if (operation === "call") {
        if (!functionSig) {
          return JSON.stringify({
            error: "functionSig is required for call operations",
          });
        }

        const iface = new ethers.Interface([`function ${functionSig}`]);
        const fragment = iface.getFunction(functionSig.split("(")[0]);
        if (!fragment) {
          return JSON.stringify({ error: `Could not parse function: ${functionSig}` });
        }

        const parsedArgs = args ? args.split(",").map((a) => a.trim()) : [];
        const callData = iface.encodeFunctionData(fragment, parsedArgs);

        const result = await provider.call({ to: address, data: callData });
        const decoded = iface.decodeFunctionResult(fragment, result);

        return JSON.stringify({
          result: decoded.length === 1 ? decoded[0].toString() : decoded.map((d: unknown) => String(d)),
        });
      }

      return JSON.stringify({ error: `Unknown operation: ${operation}` });
    } catch (error) {
      return JSON.stringify({
        error: `Blockchain read failed: ${error}`,
      });
    }
  },
  {
    name: "read_blockchain",
    description:
      'Reads data from the blockchain. Supports: "call" to invoke view/pure functions, "storage" to read raw storage slots, "balance" to check ETH balance.',
    schema: z.object({
      operation: z
        .enum(["call", "storage", "balance"])
        .describe("Type of read operation"),
      address: z.string().describe("Target contract or account address"),
      functionSig: z
        .string()
        .optional()
        .describe(
          'For call: full function signature (e.g., "owner() returns (address)", "balanceOf(address) returns (uint256)")'
        ),
      args: z
        .string()
        .optional()
        .describe(
          'For call: comma-separated arguments (e.g., "0x1234...")'
        ),
      slot: z
        .string()
        .optional()
        .describe('For storage: storage slot number (e.g., "0", "1")'),
    }),
  }
);
