import { ethers, type TransactionResponse } from "ethers";
import { getProvider } from "./provider.js";
import { optimizeFee } from "./optimizer.js";
import type { TransactionRequest, FeeOptions, FeeResult } from "./types.js";

export async function sendOptimizedTransaction(
  tx: TransactionRequest,
  options: FeeOptions & { privateKey: string }
): Promise<TransactionResponse> {
  const { privateKey, rpcUrl, speed } = options;

  if (!privateKey) throw new Error("PRIVATE_KEY is required for sending tx");

  const provider = getProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const fees: FeeResult = await optimizeFee({ speed, rpcUrl });

  if (!tx.gasLimit) {
    const estimatedGas = await provider.estimateGas(
      tx as ethers.TransactionRequest
    );
    tx.gasLimit = (estimatedGas * 12n) / 10n;
  }

  const txWithFees = {
    ...tx,
    maxFeePerGas: ethers.parseUnits(fees.maxFeePerGas.toFixed(2), "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits(
      fees.maxPriorityFeePerGas.toFixed(2),
      "gwei"
    ),
  };

  return wallet.sendTransaction(txWithFees as ethers.TransactionRequest);
}
