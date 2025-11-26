import { ethers } from "ethers";
import { Provider } from "./types.js";

/**
 * Creates an ethers.js JsonRpcProvider instance.
 * Uses the provided rpcUrl or falls back to the RPC_URL environment variable.
 * @param rpcUrl Optional. The Ethereum node RPC URL.
 * @returns An initialized ethers.js JsonRpcProvider instance.
 * @throws {Error} If no RPC URL is found (via argument or RPC_URL environment variable).
 * @example
 * const provider = getProvider('YOUR_RPC_URL');
 */
export function getProvider(rpcUrl?: string): Provider {
  const url = rpcUrl || process.env.RPC_URL;
  if (!url) throw new Error("RPC URL is not provided!");
  return new ethers.JsonRpcProvider(url);
}
