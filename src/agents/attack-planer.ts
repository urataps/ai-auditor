import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";

export function attackPlaner() {
  const systemMsg = `You are a smart contract security expert participating in the Ethernaut CTF wargame.

You will receive the full context of an Ethernaut level, including:
- The challenge objective/description
- The target contract source code
- The factory contract source code (contains the win condition in validateInstance)
- Deployment information (addresses, funds)

Your task:
1. Analyze the target contract and identify the vulnerability.
2. Examine the factory's validateInstance function to understand exactly what conditions must be met to pass the level.
3. Devise a step-by-step exploitation plan.

The following capabilities are available in the system for executing your plan:
- **Solidity Compilation**: Attack contracts are compiled using Foundry (forge build). forge-std is available for imports.
- **Contract Deployment**: Attack contracts will be deployed to a local Anvil devnet with constructor arguments and optional ETH value.
- **Transaction Execution**: The system can call functions on deployed contracts and send ETH.
- **Blockchain Reading**: The system can read account balances, storage slots, and call view/pure functions.

Guidelines:
- Prefer constructor-based attacks where the exploit executes entirely within the attack contract's constructor. This is the simplest approach — deploying the contract IS the attack.
- If a constructor-based attack is not possible (e.g., the exploit requires multiple separate transactions, msg.sender must be an EOA, or post-deployment callbacks are needed), explain why and describe the required transaction sequence.
- Be concise. Focus only on the technical exploitation steps.
- Specify what the attack contract needs: constructor arguments, payable constructor, interfaces to define, etc.`;

  const userMsg = `{context}`;

  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemMsg),
    HumanMessagePromptTemplate.fromTemplate(userMsg),
  ]);

  const model = new ChatOpenAI({
    temperature: 0.2,
    modelName: "gpt-4",
  });

  return RunnableSequence.from([prompt, model]);
}
