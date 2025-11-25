import { getProvider } from "./provider.js";
import type { FeeOptions, FeeResult, TransactionRequest } from "./types.js";

/**
 * Estimate fees for a transaction.
 * - Uses latest block baseFeePerGas
 * - Applies priority fee based on speed
 * - Adds 10% safety margin to maxFee
 * - Supports user-defined minPriority and maxFeeBudget
 */
export async function estimateFees(
  tx: TransactionRequest,
  options: FeeOptions = {}
): Promise<FeeResult> {
  const provider = getProvider(options.rpcUrl);
  const block = await provider.getBlock("latest");

  const baseFee = block?.baseFeePerGas ? Number(block.baseFeePerGas) / 1e9 : 50;

  let priorityFee: number;

  switch (options.speed) {
    case "slow":
      priorityFee = 1;
      break;
    case "normal":
      priorityFee = 3;
      break;
    case "fast":
      priorityFee = 6;
      break;
    default:
      priorityFee = 3;
  }

  if (options.minPriority && priorityFee < options.minPriority)
    priorityFee = options.minPriority;

  let maxFee = baseFee + priorityFee * 1.1;
  if (options.maxFeeBudget && maxFee > options.maxFeeBudget)
    maxFee = options.maxFeeBudget;

  const gasLimit = tx.gasLimit || 21000;
  const estimatedTotalCost = (maxFee * gasLimit) / 1e9;

  return {
    maxFeePerGas: maxFee,
    maxPriorityFeePerGas: priorityFee,
    estimatedTotalCost,
  };
}
