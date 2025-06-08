import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";

export function attackPlaner() {
  const systemMsg = `
  You are a smart contract security expert participating in a Capture The Flag (CTF) competition.
  You will receive a smart contract and a challenge description.
  
  Your task is to identify the vulnerability and outline a concise, step-by-step plan to exploit it.
  Focus only on technical details that are relevant to performing the exploit.
  Avoid filler text. Respond with clear and structured reasoning.
  `;

  const userMsg = `{description}\n\n{code}`;

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
