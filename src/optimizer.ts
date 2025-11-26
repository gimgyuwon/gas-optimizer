import { getProvider } from "./provider.js";
import { getHistoricalBaseFees } from "./estimator.js";
import type { FeeResult, FeeOptions, SpeedProfile } from "./types.js";

/**
 * Configuration for fee calculation based on desired speed (slow, normal, fast).
 * These settings tune the Base Fee prediction (EWMA) and the aggressiveness of the Priority Fee.
 */
const SPEED_PROFILE: Record<string, SpeedProfile> = {
  // Slow: Uses more history (15 blocks) and lower alpha for stable Base Fee, and a low tip multiplier.
  slow: { alpha: 0.2, blocks: 15, priorityMul: 0.75, percentile: 0.7 },
  // Normal: Balanced settings for average inclusion speed.
  normal: { alpha: 0.3, blocks: 10, priorityMul: 1.0, percentile: 0.85 },
  // Fast: Uses less history (5 blocks) and higher alpha for fast-changing Base Fee prediction, and a high tip multiplier.
  fast: { alpha: 0.5, blocks: 5, priorityMul: 1.5, percentile: 0.95 },
};

// Protocol safeguard: Minimum Priority Fee (tip) to ensure validator inclusion incentive.
const MIN_PRIORITY_FEE_GWEI = 2;
// Protocol safeguard: Minimum total Max Fee to ensure the transaction is not rejected immediately.
const MIN_MAX_FEE_GWEI = 2;

/**
 * Calculates the predicted Base Fee using Exponentially Weighted Moving Average (EWMA).
 * @param baseFees Array of historical Base Fees (in Gwei).
 * @param alpha The EWMA alpha coefficient.
 * @returns The predicted next Base Fee (in Gwei).
 */
function calculateEWMA(baseFees: number[], alpha: number): number {
  if (baseFees.length === 0) return 0;

  let ewma = baseFees[0];
  for (let i = 1; i < baseFees.length; i++) {
    // EWMA Formula: (alpha * current_fee) + ((1 - alpha) * previous_ewma)
    ewma = alpha * baseFees[i] + (1 - alpha) * ewma;
  }
  return ewma;
}

/**
 * Calculates optimized EIP-1559 fee parameters (Max Fee and Max Priority Fee)
 * based on historical Base Fees and network tip data.
 *
 * @param options Optional configuration including speed profile, RPC URL, and EWMA parameters.
 * @returns A promise that resolves to FeeResult containing the calculated fees in Gwei.
 * @throws {Error} If historical Base Fee data cannot be fetched.
 */
export async function optimizeFee(
  options: FeeOptions = {}
): Promise<FeeResult> {
  const speed = options.speed || "normal";
  const cfg = SPEED_PROFILE[speed];

  const blockCount = options.blockCount ?? cfg.blocks;
  const alpha = options.alpha ?? cfg.alpha;

  // 1. Parallel Execution: Start fetching historical Base Fees and current network fee data concurrently.
  const provider = getProvider(options.rpcUrl);

  const [baseFees, feeData] = await Promise.all([
    getHistoricalBaseFees(options.rpcUrl, blockCount),
    provider.getFeeData(),
  ]);

  if (!baseFees.length) throw new Error("No baseFee data available");

  // 2. Calculate the next predicted Base Fee using EWMA.
  const ewma = calculateEWMA(baseFees, alpha);

  // 3. Determine the base tip amount from network data.
  // NOTE: feeData.maxPriorityFeePerGas is BigInt (Wei), converting to Gwei (number).
  let baseTipGwei = Number(feeData.maxPriorityFeePerGas ?? BigInt(2e9)) / 1e9;

  // 4. Apply the minimum Priority Fee floor (default 2 Gwei).
  baseTipGwei = Math.max(
    baseTipGwei,
    options.minPriorityFee ?? MIN_PRIORITY_FEE_GWEI
  );

  // 5. Calculate the final Max Priority Fee based on the speed profile's multiplier and percentile.
  const priorityFeeGwei = baseTipGwei * cfg.priorityMul * cfg.percentile;

  // 6. Calculate the final Max Fee Per Gas: Predicted Base Fee (EWMA) + Final Priority Fee.
  // Apply the minimum protocol safeguard (MIN_MAX_FEE_GWEI).
  const maxFeeGwei = Math.max(ewma + priorityFeeGwei, MIN_MAX_FEE_GWEI);

  // Return the calculated fees.
  return {
    maxFeePerGas: maxFeeGwei,
    maxPriorityFeePerGas: priorityFeeGwei,
  };
}
