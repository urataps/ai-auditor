import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { CONFIG } from "../config";

export function createModel(): BaseChatModel {
  if (CONFIG.MODEL_PROVIDER === "anthropic") {
    return new ChatAnthropic({
      model: CONFIG.MODEL_NAME,
      topP: 1,
      temperature: null,
    });
  }
  return new ChatOpenAI({
    temperature: CONFIG.TEMPERATURE,
    modelName: CONFIG.MODEL_NAME,
  });
}
