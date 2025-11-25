import { ethers } from "ethers";

export function getProvider(rpcUrl?: string): ethers.JsonRpcProvider {
  const url = rpcUrl || process.env.RPC_URL;

  if (!url) throw new Error("RPC URL is not provided!");

  return new ethers.JsonRpcProvider(`${url}`);
}
