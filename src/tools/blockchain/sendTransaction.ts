import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ethers } from "ethers";
import { CONFIG } from "../../config";

function getWallet(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  return new ethers.Wallet(CONFIG.PLAYER_PRIVATE_KEY, provider);
}

export const sendTransactionTool = tool(
  async ({ to, functionSig, args, value }): Promise<string> => {
    try {
      const wallet = getWallet();

      // If no function signature, send a plain ETH transfer
      if (!functionSig || functionSig === "") {
        const tx = await wallet.sendTransaction({
          to,
          value: value ? ethers.parseEther(value) : 0n,
        });
        const receipt = await tx.wait();

        return JSON.stringify({
          success: receipt!.status === 1,
          txHash: receipt!.hash,
          gasUsed: receipt!.gasUsed.toString(),
        });
      }

      const iface = new ethers.Interface([`function ${functionSig}`]);
      const fragment = iface.getFunction(functionSig.split("(")[0]);
      if (!fragment) {
        return JSON.stringify({
          success: false,
          error: `Could not parse function: ${functionSig}`,
        });
      }

      const parsedArgs = args ? args.split(",").map((a) => a.trim()) : [];
      const callData = iface.encodeFunctionData(fragment, parsedArgs);

      const txRequest: ethers.TransactionRequest = {
        to,
        data: callData,
      };
      if (value) {
        txRequest.value = ethers.parseEther(value);
      }

      const tx = await wallet.sendTransaction(txRequest);
      const receipt = await tx.wait();

      return JSON.stringify({
        success: receipt!.status === 1,
        txHash: receipt!.hash,
        gasUsed: receipt!.gasUsed.toString(),
      });
    } catch (error: unknown) {
      // Try to extract revert reason
      let revertReason = "Unknown";
      const errStr = String(error);
      const revertMatch = errStr.match(/reason="([^"]+)"/);
      if (revertMatch) {
        revertReason = revertMatch[1];
      } else if (errStr.includes("revert")) {
        revertReason = errStr.slice(0, 500);
      }

      return JSON.stringify({
        success: false,
        error: `Transaction reverted: ${revertReason}`,
        details: errStr.slice(0, 1000),
      });
    }
  },
  {
    name: "send_transaction",
    description:
      'Sends a transaction to a contract on the local Anvil blockchain. Can call functions like attack(), withdraw(), etc. For plain ETH transfer, leave functionSig empty.',
    schema: z.object({
      to: z.string().describe("Target contract address"),
      functionSig: z
        .string()
        .optional()
        .describe(
          'Function signature (e.g., "attack()", "attack(address)", "withdraw()"). Leave empty for plain ETH transfer.'
        ),
      args: z
        .string()
        .optional()
        .describe('Comma-separated function arguments (e.g., "0x1234...,100")'),
      value: z
        .string()
        .optional()
        .describe('ETH to send with transaction (e.g., "0.001")'),
    }),
  }
);
