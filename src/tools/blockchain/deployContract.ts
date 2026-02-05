import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { CONFIG } from "../../config";

function getWallet(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  return new ethers.Wallet(CONFIG.PLAYER_PRIVATE_KEY, provider);
}

export const deployContractTool = tool(
  async ({ contractName, constructorArgs, value }): Promise<string> => {
    try {
      const name = contractName.replace(".sol", "");
      const artifactPath = path.join(
        CONFIG.ETHERNAUT_CONTRACTS_DIR,
        "out",
        `${name}.sol`,
        `${name}.json`
      );

      if (!fs.existsSync(artifactPath)) {
        return JSON.stringify({
          success: false,
          error: `Artifact not found: ${artifactPath}. Did you compile the contract first?`,
        });
      }

      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
      const abi = artifact.abi;
      const bytecode = artifact.bytecode?.object || artifact.bytecode;

      if (!bytecode) {
        return JSON.stringify({
          success: false,
          error: "No bytecode found in artifact. Is this an interface or abstract contract?",
        });
      }

      const wallet = getWallet();
      const factory = new ethers.ContractFactory(abi, bytecode, wallet);

      const parsedArgs = constructorArgs
        ? constructorArgs.split(",").map((a) => a.trim())
        : [];

      const overrides: ethers.Overrides = {};
      if (value) {
        overrides.value = ethers.parseEther(value);
      }

      const contract = await factory.deploy(...parsedArgs, overrides);
      await contract.waitForDeployment();
      const deployedAddress = await contract.getAddress();

      return JSON.stringify({
        success: true,
        address: deployedAddress,
        contractName: name,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Deployment failed: ${error}`,
      });
    }
  },
  {
    name: "deploy_contract",
    description:
      "Deploys a compiled Solidity contract to the local Anvil blockchain. The contract must be compiled first using compile_contract. Returns the deployed address.",
    schema: z.object({
      contractName: z
        .string()
        .describe('Contract name matching the .sol filename (e.g., "MyAttack")'),
      constructorArgs: z
        .string()
        .optional()
        .describe(
          'Comma-separated constructor arguments (e.g., "0x1234...,100")'
        ),
      value: z
        .string()
        .optional()
        .describe('ETH to send with deployment (e.g., "0.001")'),
    }),
  }
);
