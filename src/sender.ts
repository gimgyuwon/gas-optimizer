import { ethers } from "ethers";
import { getProvider } from "./provider.js";
import { optimizeFee } from "./optimizer.js";

export async function sendOptimizedTransaction(
  tx: ethers.TransactionRequest,
  speed: "slow" | "normal" | "fast" = "normal",
  rpcUrl?: string
) {
  const provider = getProvider(rpcUrl);
  const signer = await provider.getSigner();

  const fees = await optimizeFee(speed, rpcUrl);

  if (!tx.gasLimit) {
    const estimatedGas = await provider.estimateGas(tx);
    const gasLimit = (estimatedGas * 12n) / 10n;
  }

  const txWithFees = {
    ...tx,
    maxFeePerGas: ethers.parseUnits(fees.maxFeePerGas.toFixed(2), "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits(
      fees.maxPriorityFeePerGas.toFixed(2),
      "gwei"
    ),
  };

  return signer.sendTransaction(txWithFees);
}
