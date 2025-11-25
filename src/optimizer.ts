import { getProvider } from "./provider.js";
import { getHistoricalBaseFees } from "./estimator.js";

const SPEED_PROFILE = {
  slow: { alpha: 0.2, blocks: 15, priorityMul: 0.75, percentile: 0.7 },
  normal: { alpha: 0.3, blocks: 10, priorityMul: 1.0, percentile: 0.85 },
  fast: { alpha: 0.5, blocks: 5, priorityMul: 1.5, percentile: 0.95 },
};

export async function optimizeFee(
  speed: "slow" | "normal" | "fast" = "normal",
  rpcUrl?: string
) {
  const cfg = SPEED_PROFILE[speed];

  // network recent gas
  const baseFees = await getHistoricalBaseFees(rpcUrl, cfg.blocks);

  if (baseFees.length === 0) {
    throw new Error("No baseFee data available");
  }

  // EWMA
  let ewma = baseFees[0]!;
  for (let i = 1; i < baseFees.length; i++) {
    ewma = cfg.alpha * baseFees[i]! + (1 - cfg.alpha) * ewma;
  }

  const provider = getProvider(rpcUrl);
  const feeData = await provider.getFeeData();

  const baseTip = Number(feeData.maxPriorityFeePerGas ?? 2);
  const priorityFee = baseTip * cfg.priorityMul * cfg.percentile;

  const maxFee = ewma + priorityFee;

  return {
    maxFeePerGas: maxFee,
    maxPriorityFeePerGas: priorityFee,
  };
}
