import { getProvider } from "./provider.js";
import { getHistoricalBaseFees } from "./estimator.js";
import type { FeeResult, FeeOptions, SpeedProfile } from "./types.js";

const SPEED_PROFILE: Record<string, SpeedProfile> = {
  slow: { alpha: 0.2, blocks: 15, priorityMul: 0.75, percentile: 0.7 },
  normal: { alpha: 0.3, blocks: 10, priorityMul: 1.0, percentile: 0.85 },
  fast: { alpha: 0.5, blocks: 5, priorityMul: 1.5, percentile: 0.95 },
};

export async function optimizeFee(
  options: FeeOptions = {}
): Promise<FeeResult> {
  const speed = options.speed || "normal";
  const cfg = SPEED_PROFILE[speed];

  const blockCount = options.blockCount ?? cfg.blocks;
  const alpha = options.alpha ?? cfg.alpha;

  // network recent gas
  const baseFees = await getHistoricalBaseFees(options.rpcUrl, blockCount);
  if (!baseFees.length) throw new Error("No baseFee data available");

  // EWMA
  let ewma = baseFees[0]!;
  for (let i = 1; i < baseFees.length; i++) {
    ewma = alpha * baseFees[i]! + (1 - alpha) * ewma;
  }

  const provider = getProvider(options.rpcUrl);
  const feeData = await provider.getFeeData();
  let baseTip = Number(feeData.maxPriorityFeePerGas ?? 2);
  if (options.minPriorityFee)
    baseTip = Math.max(baseTip, options.minPriorityFee);

  const priorityFee = baseTip * cfg.priorityMul * cfg.percentile;
  const maxFee = ewma + priorityFee;

  const result: FeeResult = {
    maxFeePerGas: maxFee,
    maxPriorityFeePerGas: priorityFee,
  };

  if (options.maxFeeBudget) {
    result.estimatedTotalCost = Math.min(maxFee, options.maxFeeBudget);
  }

  return result;
}
