import { getProvider } from "./provider.js";

function ewma(prev: number, current: number, alpha = 0.3) {
  return alpha * current + (1 - alpha) * prev;
}

function computePriorityFee(
  baseTip: number,
  speed: "slow" | "normal" | "fast"
) {
  let multiplier = 1;
  let percentile = 0.85;

  if (speed === "fast") {
    multiplier = 1.5;
    percentile = 0.95;
  } else if (speed === "slow") {
    multiplier = 0.75;
    percentile = 0.7;
  }

  return baseTip * multiplier * percentile;
}

export async function optimizeFee(
  rpcUrl?: string,
  numBlocks = 5,
  speed: "slow" | "normal" | "fast" = "normal"
) {
  // get provider
  const provider = getProvider(rpcUrl);

  // initialize prevBase list
  const prevBase: number[] = [];

  // collect latest N block
  let latestBlock = await provider.getBlock("latest");
  if (!latestBlock) throw new Error("Failed to fetch latest block");
  for (let i = 1; i < numBlocks; i++) {
    const block = await provider.getBlock(latestBlock.number - i);
    prevBase.push(Number(block?.baseFeePerGas ?? 0) / 1e9);
  }

  // calculate ewma
  let alpha = 0.3;
  if (speed === "fast") alpha = 0.5;
  if (speed === "slow") alpha = 0.2;

  let ewmaBase = prevBase[0]!;
  for (let i = 1; i < prevBase.length; i++) {
    ewmaBase = ewma(ewmaBase, prevBase[i]!, alpha);
  }

  // decide priortyFee
  const feeData = await provider.getFeeData();
  const baseTip = Number(feeData.maxPriorityFeePerGas ?? 2);
  const priorityFee = computePriorityFee(baseTip, speed);

  const maxFee = ewmaBase + priorityFee;

  return { maxFeePerGas: maxFee, maxPriorityFeePerGas: priorityFee };
}
