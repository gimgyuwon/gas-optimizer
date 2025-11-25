import { ethers, type TransactionRequest } from "ethers";
import { getProvider } from "./provider.js";
import { optimizeFee } from "./optimizer.js";

export async function sendOptimizedTransaction(
  tx: TransactionRequest,
  speed: "slow" | "normal" | "fast" = "normal",
  rpcUrl?: string
) {
  const provider = getProvider(rpcUrl);
  const signer = await provider.getSigner();

  const fees = await optimizeFee(rpcUrl, speed);

  const txWithFees = {
    ...tx,
    maxFeePerGas: ethers.parseUnits(fees.maxFeePerGas.toString(), "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits(
      fees.maxPriorityFeePerGas.toString(),
      "gwei"
    ),
  };

  const txResponse = await signer.sendTransaction(txWithFees);
  return txResponse;
}
