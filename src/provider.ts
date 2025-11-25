import { ethers } from "ethers";

export function getProvider(rpcUrl?: string): ethers.JsonRpcProvider {
  const provider = rpcUrl || process.env.RPC_URL;

  if (!provider)
    throw new Error(
      "RPC provider not provided. Set process.env.RPC_URL or pass rpcUrl option"
    );

  return new ethers.JsonRpcProvider(`${provider}`);
}
