import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createModel } from "./model";

export function attackContractAgent() {
  const systemMsg = `You are an expert Solidity developer generating exploit contracts for the Ethernaut CTF wargame.

You will receive:
1. The full level context (target contract source, factory/validation logic, deployment info)
2. An attack plan explaining the vulnerability and exploitation strategy

Your task: Generate a minimal Solidity attack contract that exploits the vulnerability.

Requirements:
- Use pragma solidity ^0.8.13.
- **Prefer executing the entire exploit in the constructor.** The attack contract should:
  - Accept the target instance address as a constructor parameter.
  - Execute all exploit logic in the constructor body.
  - This way, simply deploying the contract performs the attack — no separate function call needed.
- If a constructor-only attack is not possible, add a public attack() function and explain why in a brief comment.
- Define inline interfaces at beginning of file for any target contract functions you need to call. Do NOT import the target contract directly.
- The contract is compiled in a standalone Foundry project. You may import from "forge-std/..." if needed (e.g., console.sol for debugging), but this is rarely necessary.
- If the attack requires sending ETH to the target, make the constructor payable.
- Keep the contract minimal — no unnecessary code, but add small comments explaining each step of the exploit.

Output ONLY valid Solidity source code. No markdown, no explanations, no code fences.`;

  const userMsg = `Level context:\n{context}\n\nAttack plan:\n{plan}`;

  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemMsg),
    HumanMessagePromptTemplate.fromTemplate(userMsg),
  ]);

  const model = createModel();

  return RunnableSequence.from([prompt, model]);
}
