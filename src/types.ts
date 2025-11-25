export interface TransactionRequest {
  to: string;
  value: string;
  data?: string;
  gasLimit?: number;
}

export interface FeeOptions {
  speed?: "slow" | "normal" | "fase";
  maxFeeBudget?: number;
  minPriority?: number;
}

export interface FeeResult {
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  estimatedTotalCost: number;
}
