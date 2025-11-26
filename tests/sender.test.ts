import { sendOptimizedTransaction, SendOptions } from "../src/sender.js";
import { getProvider } from "../src/provider.js";
import { optimizeFee } from "../src/optimizer.js";
import { ethers } from "ethers";
import { TransactionResponse } from "ethers";

jest.mock("../src/provider.js");
jest.mock("../src/optimizer.js");

const mockGetProvider = getProvider as jest.Mock;
const mockOptimizeFee = optimizeFee as jest.Mock;

const mockSigner = {
  sendTransaction: jest.fn(),
  provider: null,
} as unknown as ethers.Wallet;

const mockProvider = {
  estimateGas: jest.fn(),
  getFeeData: jest.fn(),
} as unknown as ethers.JsonRpcProvider;

// Intercept the ethers.Wallet constructor and return our mockSigner.
jest.spyOn(ethers, "Wallet").mockImplementation(() => mockSigner as any);

// Configure getProvider to return our mockProvider.
mockGetProvider.mockReturnValue(mockProvider);

// Type assertions for the mocked functions for Jest's methods.
const mockEstimateGas = mockProvider.estimateGas as jest.Mock;
const mockSendTransaction = mockSigner.sendTransaction as jest.Mock;

describe("sendOptimizedTransaction", () => {
  // Common setup constants
  const DEFAULT_TX = { to: "0xRecipient", value: 1000n, data: "0x" };
  const DEFAULT_OPTIONS: SendOptions = {
    privateKey: "0xdeadbeef",
    rpcUrl: "mock-rpc",
    speed: "normal",
  };
  const OPTIMIZED_FEES = { maxFeePerGas: 20, maxPriorityFeePerGas: 3 }; // 20 Gwei, 3 Gwei

  // Reset mocks before each test to ensure isolation.
  beforeEach(() => {
    jest.clearAllMocks();
    // Default optimistic fee prediction.
    mockOptimizeFee.mockResolvedValue(OPTIMIZED_FEES);
  });

  // --- Scenario 1: Automatic Gas Limit Estimation ---
  test("should estimate gas limit if none is provided and send the transaction", async () => {
    const ESTIMATED_GAS = 50000n;
    // Expected Gas Limit: 50,000 * 1.2 = 60,000n (20% safety margin)
    const EXPECTED_GAS_LIMIT = (ESTIMATED_GAS * 12n) / 10n;

    // Mock RPC responses
    mockEstimateGas.mockResolvedValue(ESTIMATED_GAS);
    mockSendTransaction.mockResolvedValue({
      hash: "0xmockhash",
    } as TransactionResponse);

    // ACT: Call function with gasLimit set to undefined
    const response = await sendOptimizedTransaction(
      { ...DEFAULT_TX, gasLimit: undefined },
      DEFAULT_OPTIONS
    );

    // ASSERT 1: Gas estimation was executed.
    expect(mockEstimateGas).toHaveBeenCalledTimes(1);

    // ASSERT 2: The final transaction object contains the calculated safety margin.
    expect(mockSendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        gasLimit: EXPECTED_GAS_LIMIT,
      })
    );

    // ASSERT 3: Returns the mock response.
    expect(response.hash).toBe("0xmockhash");
  });

  // --- Scenario 2: Skipping Estimation ---
  test("should use provided gas limit and skip estimation", async () => {
    const PROVIDED_GAS = 80000n;

    // ACT: Call function with explicit gasLimit.
    await sendOptimizedTransaction(
      { ...DEFAULT_TX, gasLimit: PROVIDED_GAS },
      DEFAULT_OPTIONS
    );

    // ASSERT 1: Gas estimation should NOT have been called.
    expect(mockEstimateGas).not.toHaveBeenCalled();

    // ASSERT 2: The final transaction object uses the provided value.
    expect(mockSendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        gasLimit: PROVIDED_GAS,
      })
    );
  });

  // --- Scenario 3: Max Budget Capping (MaxFeePerGas Adjustment) ---
  test("should cap maxFeePerGas when total cost exceeds maxBudget", async () => {
    // Setup: GasLimit is assumed to be 100,000n after margin.
    // Optimized Fee is 20 Gwei. Total cost: 0.002 ETH.

    // Budget Cap: 0.001 ETH (forces fee cap down).
    const MAX_BUDGET_WEI = ethers.parseEther("0.001");

    // Mock: Estimate gas to result in 100,000n limit (83333n * 1.2n ~= 100000n).
    mockEstimateGas.mockResolvedValue(83333n);
    mockSendTransaction.mockResolvedValue({
      hash: "0xmockhash",
    } as TransactionResponse);

    // ACT
    await sendOptimizedTransaction(
      { ...DEFAULT_TX, gasLimit: undefined },
      { ...DEFAULT_OPTIONS, maxBudget: MAX_BUDGET_WEI }
    );

    const sentTx = mockSendTransaction.mock.calls[0][0];

    // ASSERT 1: MaxFeePerGas is capped at 10 Gwei (from the original 20 Gwei).
    expect(sentTx.maxFeePerGas.toString()).toBe(
      ethers.parseUnits("10.00", "gwei").toString()
    );

    // ASSERT 2: MaxPriorityFeePerGas (originally 3 Gwei) is below the cap (10 Gwei) and thus unchanged.
    expect(sentTx.maxPriorityFeePerGas.toString()).toBe(
      ethers.parseUnits("3.00", "gwei").toString()
    );
  });

  // --- Scenario 4: Priority Fee Capping (Math.min Logic) ---
  test("should cap maxPriorityFeePerGas if its value exceeds the new adjusted MaxFee", async () => {
    // Mock: OptimizeFee returns PriorityFee=15 Gwei (higher than the upcoming MaxFee cap).
    mockOptimizeFee.mockResolvedValue({
      maxFeePerGas: 20,
      maxPriorityFeePerGas: 15,
    });

    // Setup: Budget forces MaxFee down to 5 Gwei.
    // Budget: 0.0005 ETH / 100,000 Gas = 5 Gwei
    const MAX_BUDGET_WEI_LOW = ethers.parseUnits("0.0005", "ether");

    // Mock: Gas estimation setup
    mockEstimateGas.mockResolvedValue(83333n);

    // ACT
    await sendOptimizedTransaction(
      { ...DEFAULT_TX, gasLimit: undefined },
      { ...DEFAULT_OPTIONS, maxBudget: MAX_BUDGET_WEI_LOW }
    );

    const sentTx = mockSendTransaction.mock.calls[0][0];

    // ASSERT 1: MaxFeePerGas is adjusted to 5 Gwei.
    expect(sentTx.maxFeePerGas.toString()).toBe(
      ethers.parseUnits("5.00", "gwei").toString()
    );

    // ASSERT 2: PriorityFee (15 Gwei) must be capped by MaxFee (5 Gwei). Math.min(15, 5) = 5.
    expect(sentTx.maxPriorityFeePerGas.toString()).toBe(
      ethers.parseUnits("5.00", "gwei").toString()
    );
  });
});
