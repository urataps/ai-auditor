export { writeAttackContractTool } from "./writeAttackContract";
export { compileContractTool } from "./compileContract";
export { deployContractTool } from "./deployContract";
export { sendTransactionTool } from "./sendTransaction";
export { readBlockchainTool } from "./readBlockchain";

import { writeAttackContractTool } from "./writeAttackContract";
import { compileContractTool } from "./compileContract";
import { deployContractTool } from "./deployContract";
import { sendTransactionTool } from "./sendTransaction";
import { readBlockchainTool } from "./readBlockchain";

export const blockchainTools = [
  writeAttackContractTool,
  compileContractTool,
  deployContractTool,
  sendTransactionTool,
  readBlockchainTool,
];
