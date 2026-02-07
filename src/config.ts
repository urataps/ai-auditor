import * as path from "path";

export const CONFIG = {
  // Anvil local blockchain
  RPC_URL: "http://localhost:8545",
  CHAIN_ID: 31337,
  // Anvil account 0 (well-known Foundry default)
  PLAYER_PRIVATE_KEY:
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  PLAYER_ADDRESS: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",

  // Compiler working directory (standalone Foundry project)
  COMPILER_ENV_DIR: path.resolve(__dirname, "../work-dir/compiler-env"),
  COMPILER_SRC_DIR: path.resolve(__dirname, "../work-dir/compiler-env/src"),
  COMPILER_OUT_DIR: path.resolve(__dirname, "../work-dir/compiler-env/out"),

  // Game data paths
  GAME_DATA_DIR: path.resolve(__dirname, "./game-data/ethernaut"),
  DEPLOY_LOCAL_PATH: path.resolve(
    __dirname,
    "./game-data/ethernaut/deploy.local.json",
  ),
  GAMEDATA_PATH: path.resolve(__dirname, "./game-data/ethernaut/gamedata.json"),
  CONTRACTS_SOURCE_PATH: path.resolve(
    __dirname,
    "./game-data/ethernaut/contracts",
  ),
  DOCS_PATH: path.resolve(__dirname, "./game-data/ethernaut/docs"),

  // Agent config
  MAX_ITERATIONS: 15,
  MODEL_NAME: "gpt-4.1",
  TEMPERATURE: 0.2,

  // Server
  PORT: 3001,
};
