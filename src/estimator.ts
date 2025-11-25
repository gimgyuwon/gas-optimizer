import { getProvider } from "./provider.js";

export async function getHistoricalBaseFees(
  rpcUrl?: string,
  blockCount = 10
): Promise<number[]> {
  const provider = getProvider(rpcUrl);
  const fees: number[] = [];

  const latest = await provider.getBlock("latest");
  if (!latest) throw new Error("Failed to fetch latest block");

  for (let i = 0; i < blockCount; i++) {
    const b = await provider.getBlock(latest.number - i);
    fees.push(Number(b?.baseFeePerGas ?? 0) / 1e9);
  }

  return fees;
}
