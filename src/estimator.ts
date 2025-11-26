import { getProvider } from "./provider.js";

/**
 * Fetches the Base Fee Per Gas from the most recent historical blocks.
 * This data (in Gwei) is used for EIP-1559 fee prediction (EWMA).
 * @param rpcUrl Optional. The Ethereum node RPC URL.
 * @param blockCount Optional. The number of recent blocks to fetch. Defaults to 10.
 * @returns A promise that resolves to an array of Base Fees, in Gwei.
 * @throws {Error} If the latest block information cannot be fetched.
 */
export async function getHistoricalBaseFees(
  rpcUrl?: string,
  blockCount = 10
): Promise<number[]> {
  const provider = getProvider(rpcUrl);
  const fees: number[] = [];

  const latest = await provider.getBlock("latest");
  if (!latest) throw new Error("Failed to fetch latest block");

  // Fetch Base Fee for the last 'blockCount' blocks, starting from the latest.
  for (let i = 0; i < blockCount; i++) {
    const b = await provider.getBlock(latest.number - i);

    // Convert the Base Fee from Wei to Gwei (by dividing by 1e9).
    fees.push(Number(b?.baseFeePerGas ?? 0) / 1e9);
  }

  return fees;
}
