import { GenezioDeploy, GenezioMethod } from "@genezio/types";
import dotenv from "dotenv";

import { attackPlaner } from "./agents/attack-planer";
import { attackContractAgent } from "./agents/attack-contract";

dotenv.config();

@GenezioDeploy()
export class LlmService {
  @GenezioMethod()
  async callAuditorLLM(description: string, code: string) {
    const planResponse = await attackPlaner().invoke({
      description: description,
      code: code,
    });

    const codeResponse = await attackContractAgent().invoke({
      description: description,
      code: code,
      explanation: planResponse.text,
    });

    return {
      attackPlan: planResponse.text,
      attackContract: codeResponse.text,
    };
  }
}
