import { ethers } from "ethers";
import { CONFIG } from "../config";

const ETHERNAUT_ABI = [
  "function createLevelInstance(address _level) public payable",
  "function submitLevelInstance(address _instance) public",
  "event LevelInstanceCreatedLog(address indexed player, address indexed instance, address indexed level)",
  "event LevelCompletedLog(address indexed player, address indexed instance, address indexed level)",
];

function getWallet(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  return new ethers.Wallet(CONFIG.PLAYER_PRIVATE_KEY, provider);
}

function getEthernautContract(address: string): ethers.Contract {
  return new ethers.Contract(address, ETHERNAUT_ABI, getWallet());
}

export async function createLevelInstance(
  ethernautAddress: string,
  factoryAddress: string,
  deployFunds: number
): Promise<string> {
  const ethernaut = getEthernautContract(ethernautAddress);

  const value = deployFunds > 0 ? ethers.parseEther(String(deployFunds)) : 0n;

  const tx = await ethernaut.createLevelInstance(factoryAddress, { value });
  const receipt = await tx.wait();

  // Parse the LevelInstanceCreatedLog event to get the instance address
  const iface = new ethers.Interface(ETHERNAUT_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed && parsed.name === "LevelInstanceCreatedLog") {
        return parsed.args.instance;
      }
    } catch {
      // Not our event, skip
    }
  }

  throw new Error(
    "Failed to extract instance address from LevelInstanceCreatedLog event"
  );
}

export async function submitLevelInstance(
  ethernautAddress: string,
  instanceAddress: string
): Promise<boolean> {
  const ethernaut = getEthernautContract(ethernautAddress);

  const tx = await ethernaut.submitLevelInstance(instanceAddress);
  const receipt = await tx.wait();

  // Check if LevelCompletedLog was emitted (means validation passed)
  const iface = new ethers.Interface(ETHERNAUT_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed && parsed.name === "LevelCompletedLog") {
        return true;
      }
    } catch {
      // Not our event, skip
    }
  }

  return false;
}
