import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createModel } from "./model";

export function deployScriptAgent() {
  const systemMsg = `You are an expert Solidity developer generating Foundry deployment scripts for the Ethernaut CTF wargame.

You will receive:
1. The full level context (target contract source, factory/validation logic, deployment info)
2. The attack plan explaining the vulnerability and exploitation strategy
3. The attack contract source code that was already compiled successfully
4. The target instance address (the deployed vulnerable contract to exploit)

Your task: Generate a Foundry Script that deploys the attack contract and performs any additional calls needed to complete the level.

Foundry Script pattern:
- Import "forge-std/Script.sol" and ALWAYS the attack contract from "../src/Contract.sol" 
- The script contract MUST be named AttackScript and inherit from Script
- Define a single run() external function containing all logic
- Wrap all on-chain actions between vm.startBroadcast() and vm.stopBroadcast()

Requirements:
- Use pragma solidity ^0.8.13
- Create a address variable for the target instance address and set it to the provided instance address
- Use interfaces from the source contract if needed. Do NOT create new ones with the same name.
- Deploy the attack contract with the correct constructor arguments, use typecasting if needed, match the types exactly so there are no compilation issues
- If the constructor is payable, send the required ETH during deployment using correct syntax 
- If the attack contract has post-deployment functions that need calling (e.g., attack()), call them after deployment
- If the exploit requires direct EOA calls to the target (without the attack contract), include those too
- Keep it minimal — no unnecessary code, but add small comments explaining each step

Output ONLY valid Solidity source code!!!`;

  const userMsg = `Level context:\n{context}\n\nAttack plan:\n{plan}\n\nAttack contract source code:\n{contractCode}\n\nTarget instance address: {instanceAddress}`;

  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemMsg),
    HumanMessagePromptTemplate.fromTemplate(userMsg),
  ]);

  const model = createModel();

  return RunnableSequence.from([prompt, model]);
}
