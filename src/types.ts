/**
 * Essential data required to send an Ethereum transaction (ethers.js compatible).
 */
export interface TransactionRequest {
  /** The recipient address. */
  to: string;
  /** The amount of Ether to send, in Wei (BigInt). */
  value: bigint;
  /** Optional. The data payload for contract interaction. */
  data?: string;
  /** Optional. Max gas units the user is willing to spend (BigInt). */
  gasLimit?: bigint;
}

/**
 * Options to customize the EIP-1559 fee estimation and set constraints.
 */
export interface FeeOptions {
  /** Optional. Desired transaction speed: 'slow', 'normal', or 'fast'. */
  speed?: "slow" | "normal" | "fast";
  /** Optional. The Ethereum node RPC URL. */
  rpcUrl?: string;
  /** Optional. Number of historical blocks for Base Fee analysis. */
  blockCount?: number;
  /** Optional. EWMA alpha coefficient for prediction smoothing. */
  alpha?: number;
  /** Optional. Private key (for specific internal use). */
  privateKey?: string;
  /** Optional. Minimum Priority Fee (tip) to propose, in Gwei. */
  minPriorityFee?: number;
  /** Optional. Max total budget for the transaction (GasLimit * MaxFeePerGas), in Wei. */
  maxFeeBudget?: number;
}

/**
 * Optimized fee parameters for an EIP-1559 transaction.
 */
export interface FeeResult {
  /** Maximum total price per gas unit the user will pay (Base Fee + Priority Fee), in Gwei. */
  maxFeePerGas: number;
  /** Maximum tip paid to the validator for priority, in Gwei. */
  maxPriorityFeePerGas: number;
  /** Optional. The total estimated cost (in Wei) if the gas limit is fully used. */
  estimatedTotalCost?: number;
}

/**
 * Configuration settings for different transaction speed profiles.
 */
export interface SpeedProfile {
  /** EWMA alpha coefficient. */
  alpha: number;
  /** Number of blocks to sample. */
  blocks: number;
  /** Multiplier applied to the calculated Priority Fee. */
  priorityMul: number;
  /** Percentile used for sampling historical Priority Fees. */
  percentile: number;
}

/**
 * Type alias for the ethers.js JsonRpcProvider.
 */
export type Provider = import("ethers").JsonRpcProvider;
