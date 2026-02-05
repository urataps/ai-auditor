import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { CONFIG } from "../../config";

export const compileContractTool = tool(
  async ({ contractName }): Promise<string> => {
    try {
      let stdout: string;
      let stderr: string;

      try {
        stdout = execSync("forge build", {
          cwd: CONFIG.ETHERNAUT_CONTRACTS_DIR,
          encoding: "utf-8",
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
        });
        stderr = "";
      } catch (error: unknown) {
        const execError = error as {
          stdout?: string;
          stderr?: string;
          status?: number;
        };
        stdout = execError.stdout || "";
        stderr = execError.stderr || String(error);

        return JSON.stringify({
          success: false,
          errors: stderr || stdout,
        });
      }

      // Check that the compiled artifact exists
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
          errors: `Compilation succeeded but artifact not found at ${artifactPath}. Check the contract name matches the Solidity contract name.`,
        });
      }

      return JSON.stringify({
        success: true,
        artifactPath,
        output: stdout.slice(0, 500),
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        errors: `Compilation failed: ${error}`,
      });
    }
  },
  {
    name: "compile_contract",
    description:
      "Compiles all contracts in the Ethernaut project using forge build. Returns compilation errors if any, or confirms the artifact exists for the specified contract.",
    schema: z.object({
      contractName: z
        .string()
        .describe(
          'Name of the contract to check compilation for (e.g., "MyAttack")'
        ),
    }),
  }
);
