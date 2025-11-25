import { ethers, type TransactionResponse } from "ethers";
import { getProvider } from "./provider.js";
import { optimizeFee } from "./optimizer.js";
import type { TransactionRequest, FeeOptions, FeeResult } from "./types.js";

export interface SendOptions extends FeeOptions {
  privateKey: string;
  maxBudget?: bigint;
}

export async function sendOptimizedTransaction(
  tx: TransactionRequest,
  options: SendOptions
): Promise<TransactionResponse> {
  const provider = getProvider(options.rpcUrl);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const fees: FeeResult = await optimizeFee(options);

  if (!tx.gasLimit) {
    const estimatedGas = await provider.estimateGas(
      tx as ethers.TransactionRequest
    );
    tx.gasLimit = (estimatedGas * 12n) / 10n;
  }

  if (options.maxBudget) {
    const maxFeeWei = BigInt(Math.floor(fees.maxFeePerGas * 1e9));
    const totalGasCost = tx.gasLimit * maxFeeWei;

    if (totalGasCost > options.maxBudget) {
      const adjustedFeeWei = options.maxBudget / tx.gasLimit;
      fees.maxFeePerGas = Number(adjustedFeeWei) / 1e9;
      fees.maxPriorityFeePerGas = Math.min(
        fees.maxPriorityFeePerGas,
        fees.maxFeePerGas
      );
    }
  }

  const txWithFees = {
    ...tx,
    maxFeePerGas: ethers.parseUnits(fees.maxFeePerGas.toFixed(2), "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits(
      fees.maxPriorityFeePerGas.toFixed(2),
      "gwei"
    ),
  };

  return signer.sendTransaction(txWithFees as ethers.TransactionRequest);
}
