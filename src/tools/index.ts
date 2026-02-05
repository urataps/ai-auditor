// Ethernaut LangChain Tools
// Game data access tools for the AI auditor

export { getLevelInfoTool, listAllLevelsTool, type LevelInfo } from './getLevelInfo';
export { getContractSourceTool, getLevelContractsTool } from './getContractSource';
export { getLevelDocsTool } from './getLevelDocs';
export { getDeploymentAddressTool, getAllDeploymentsTool } from './getDeploymentAddress';

import { getLevelInfoTool, listAllLevelsTool } from './getLevelInfo';
import { getContractSourceTool, getLevelContractsTool } from './getContractSource';
import { getLevelDocsTool } from './getLevelDocs';
import { getDeploymentAddressTool, getAllDeploymentsTool } from './getDeploymentAddress';

// All tools bundled for easy agent binding
export const ethernautTools = [
  getLevelInfoTool,
  listAllLevelsTool,
  getContractSourceTool,
  getLevelContractsTool,
  getLevelDocsTool,
  getDeploymentAddressTool,
  getAllDeploymentsTool,
];
