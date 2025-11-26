import { ethers, type TransactionResponse } from "ethers";
import { getProvider } from "./provider.js";
import { optimizeFee } from "./optimizer.js";
import type { TransactionRequest, FeeOptions, FeeResult } from "./types.js";

/**
 * Options required to send a transaction, including optimization parameters and the private key.
 */
export interface SendOptions extends FeeOptions {
  /** The private key of the account used to sign and send the transaction. (Required) */
  privateKey: string;
  /** Optional. Maximum total budget (in Wei) the user is willing to spend on gas. */
  maxBudget?: bigint;
}

/**
 * Calculates optimized EIP-1559 fees, estimates gas limit, applies budget constraints,
 * signs the transaction using the private key, and sends it to the Ethereum network.
 *
 * @param tx The base transaction details (to, value, data).
 * @param options Configuration including the private key and fee/budget constraints.
 * @returns A promise that resolves to the TransactionResponse object from the network.
 * @throws {Error} If RPC fails, fee data is unavailable, or transaction parameters are invalid.
 */
export async function sendOptimizedTransaction(
  tx: TransactionRequest,
  options: SendOptions
): Promise<TransactionResponse> {
  const provider = getProvider(options.rpcUrl);
  // Instantiate the signer using the provided private key and provider.
  const signer = new ethers.Wallet(options.privateKey, provider);

  // 1. Optimize fees: Get the predicted Max Fee and Priority Fee based on network data.
  const fees: FeeResult = await optimizeFee(options);

  // 2. Estimate gas limit if not provided.
  if (!tx.gasLimit) {
    // Fetch the minimum gas required.
    const estimatedGas = await provider.estimateGas(
      tx as ethers.TransactionRequest
    );
    // Apply a 20% safety margin: (estimatedGas * 12n) / 10n
    tx.gasLimit = (estimatedGas * 12n) / 10n;
  }

  // 3. Apply maximum budget constraint (maxBudget).
  if (options.maxBudget) {
    // Calculate the maximum cost in Wei: GasLimit * MaxFeePerGas (in Wei)
    const maxFeeWei = BigInt(Math.floor(fees.maxFeePerGas * 1e9));
    const totalGasCost = tx.gasLimit * maxFeeWei;

    if (totalGasCost > options.maxBudget) {
      // Recalculate MaxFeePerGas to ensure total cost does not exceed maxBudget.
      const adjustedFeeWei = options.maxBudget / tx.gasLimit;
      fees.maxFeePerGas = Number(adjustedFeeWei) / 1e9;

      // Ensure Max Priority Fee (tip) does not exceed the new, lower Max Fee Per Gas.
      fees.maxPriorityFeePerGas = Math.min(
        fees.maxPriorityFeePerGas,
        fees.maxFeePerGas
      );
    }
  }

  // 4. Finalize transaction object. Convert fees from Gwei (number) to Wei (BigInt).
  const txWithFees = {
    ...tx,
    // Use toFixed(2) to prevent floating point issues before conversion, as required by parseUnits.
    maxFeePerGas: ethers.parseUnits(fees.maxFeePerGas.toFixed(2), "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits(
      fees.maxPriorityFeePerGas.toFixed(2),
      "gwei"
    ),
  };

  // 5. Sign the transaction and send it to the network.
  return signer.sendTransaction(txWithFees as ethers.TransactionRequest);
}
