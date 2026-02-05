import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { blockchainTools } from "../tools/blockchain/index";
import { CONFIG } from "../config";

const SYSTEM_PROMPT = `You are an expert smart contract security researcher playing the Ethernaut CTF game.
You are interacting with a LIVE Ethereum blockchain (local Anvil devnet).

Your goal: exploit the target contract instance to pass the level's validation check.

WORKFLOW:
1. Analyze the target contract and factory validation logic to understand what conditions must be met.
2. Devise an attack strategy.
3. Write a Solidity attack contract using the write_attack_contract tool.
   - Use pragma solidity ^0.8.0 (or match the target contract's version).
   - You can import the target contract from the levels directory (see AVAILABLE IMPORTS in context).
   - Your contract should have a public attack() function (or constructor-based attack if needed).
   - The constructor should accept the target instance address.
4. Compile the contract using compile_contract. If there are errors, fix them and recompile.
5. Deploy your attack contract using deploy_contract.
6. Call the attack function(s) using send_transaction.
7. Verify the exploit worked by reading relevant state with read_blockchain.
8. When you believe the exploit succeeded, respond with "ATTACK_COMPLETE".

IMPORTANT RULES:
- Your EOA address (the player) is {playerAddress}. All transactions are sent from this address.
- The target instance is at {instanceAddress}.
- Some levels can be exploited with direct EOA transactions (send_transaction) without writing a contract.
- Some attacks require multiple steps or sending ETH with the transaction.
- If compilation fails, read the error carefully and fix your code.
- If a transaction reverts, analyze why and adjust your approach.
- If the target uses an older Solidity version (e.g., 0.6.x), define an inline interface instead of importing directly.
- Be efficient with your tool calls.

{levelContext}`;

export function createLevelPlayerAgent(
  levelContext: string,
  instanceAddress: string,
  playerAddress: string
): AgentExecutor {
  const llm = new ChatOpenAI({
    temperature: CONFIG.TEMPERATURE,
    modelName: CONFIG.MODEL_NAME,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const tools = [...blockchainTools];

  const agent = createToolCallingAgent({ llm, tools, prompt });

  return new AgentExecutor({
    agent,
    tools,
    maxIterations: CONFIG.MAX_ITERATIONS,
    returnIntermediateSteps: true,
    handleParsingErrors: true,
    verbose: true,
  });
}

export async function runLevelPlayer(
  levelContext: string,
  levelName: string,
  instanceAddress: string,
  playerAddress: string
): Promise<{ output: string; intermediateSteps: unknown[] }> {
  const executor = createLevelPlayerAgent(
    levelContext,
    instanceAddress,
    playerAddress
  );

  const result = await executor.invoke({
    input: `Exploit the "${levelName}" level. The target instance is at ${instanceAddress}.`,
    levelContext,
    instanceAddress,
    playerAddress,
  });

  return {
    output: result.output,
    intermediateSteps: result.intermediateSteps,
  };
}
