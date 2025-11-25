function ewma(prev: number, current: number, alpha = 0.3) {
  return alpha * current + (1 - alpha) * prev;
}

export function optimizeFee(
  prevBase: number[],
  mempoolPercentile: number,
  speed: "slow" | "normal" | "fast"
) {
  let ewmaBase = prevBase[0];
  for (let i = 1; i < prevBase.length; i++) {
    ewmaBase = ewma(ewmaBase, prevBase[i]);
  }

  let priorityFee = mempoolPercentile * 1e-9;
  if (speed === "fast") priorityFee *= 1.5;
  if (speed === "slow") priorityFee *= 0.7;

  const maxFee = ewmaBase + priorityFee;

  return { maxFeePerGas: maxFee, maxPriorityFeePerGas: priorityFee };
}
