export interface FeeResult {
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  estimatedTotalCost?: number;
}

export interface TransactionRequest {
  to: string;
  value: bigint;
  data?: string;
  gasLimit?: bigint;
}

export interface FeeOptions {
  speed?: "slow" | "normal" | "fast";
  rpcUrl?: string;
  blockCount?: number;
  alpha?: number;
  privateKey?: string;
  minPriorityFee?: number;
  maxFeeBudget?: number;
}

export interface FeeResult {
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  estimatedTotalCost?: number;
}

export interface SpeedProfile {
  alpha: number;
  blocks: number;
  priorityMul: number;
  percentile: number;
}

export type Provider = import("ethers").JsonRpcProvider;
