import { GenezioDeploy, GenezioMethod } from "@genezio/types";
import dotenv from "dotenv";

import { auditJsonSchema, auditorAgent } from "./agents/audit";
import { TVulnerability } from "./types";

dotenv.config();

@GenezioDeploy()
export class LlmService {
  @GenezioMethod()
  async callAuditorLLM(code: string): Promise<TVulnerability[]> {
    const response = await auditorAgent().invoke({
      code: code,
    });

    return auditJsonSchema.parse(response).audits;
  }
}
