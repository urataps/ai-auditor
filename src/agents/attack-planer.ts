import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createModel } from "./model";

export function attackPlaner() {
  const systemMsg = `You are a smart contract security expert. You analyze Ethernaut CTF levels and produce a structured attack plan that a code-generation agent will use to write the exploit contract.

Your output MUST follow this exact structure:

## SUCCESS CONDITION
Examine the factory contract's validateInstance function. State the exact boolean conditions that must be true for the level to be marked as solved. Quote the relevant Solidity expressions.

## VULNERABILITY
Identify the specific vulnerability in the target contract that can be exploited to satisfy the success condition. Name the vulnerability class and explain the root cause in 1-2 sentences.

## ATTACK PLAN
Step-by-step exploitation sequence. Number each step.

## CODE INSTRUCTIONS
Precise instructions for the attack contract generator. Include ALL of the following:

- **Pragma**: The Solidity version to use (^0.8.13 unless a specific version is required)
- **Interfaces**: List every target contract function the attack contract needs to call, with exact signatures (name, parameter types, return types, mutability)
- **Constructor parameters**: What the constructor should accept (typically the target instance address, and its type — address, or a specific interface type)
- **Constructor payable**: Whether the constructor must be payable, and if so, how much ETH is needed and why
- **Constructor logic**: Exactly what calls to make in the constructor body, in order. Specify function names, arguments, and any ETH values to forward.
- **Post-deploy functions**: If the exploit CANNOT be completed in the constructor alone, list the functions that must be called after deployment, with their signatures and call sequence. Explain WHY a constructor-only attack is not possible (e.g., msg.sender must be EOA, requires callback, needs multiple transactions).
- **Callbacks**: If the target contract calls back into the attacker (e.g., receive/fallback for reentrancy), describe what the callback function must do.

Be precise. The code generator will follow these instructions literally.`;

  const userMsg = `{context}`;

  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemMsg),
    HumanMessagePromptTemplate.fromTemplate(userMsg),
  ]);

  const model = createModel();

  return RunnableSequence.from([prompt, model]);
}
