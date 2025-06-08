import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";

export function attackContractAgent() {
  const systemMsg = `
  You are an expert Solidity developer and smart contract auditor participating in a CTF competition.
  
  You will receive:
  1. A description of the challenge
  2. The source code of a vulnerable Solidity contract
  3. An explanation of how the vulnerability works and a step-by-step attack plan.
  
  Your task is to generate a minimal **attack contract** that uses the explained vulnerability to exploit the target contract.
  
  Requirements:
  - Use the same Solidity version as the target (or higher if required by syntax)
  - Interact directly with the vulnerable contract to execute the exploit
  - The contract should have a public \`attack()\` function
  - Do not include explanations or comments unless they are strictly necessary
  
  Output ONLY valid Solidity code, nothing else.
  `;

  const userMsg = `Description: {description}\n\nCode:\n{code}\n\nExplanation:\n{explanation}`;

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
