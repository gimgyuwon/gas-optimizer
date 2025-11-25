export interface TransactionRequest {
  to: string;
  value: string;
  data?: string;
  gasLimit?: number;
}

export interface FeeOptions {
  speed?: "slow" | "normal" | "fast";
  maxFeeBudget?: number;
  minPriority?: number;
  rpcUrl?: string;
}

export interface FeeResult {
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  estimatedTotalCost: number;
}
