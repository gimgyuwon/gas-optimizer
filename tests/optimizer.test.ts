import { optimizeFee } from "../src/optimizer.js";
import { getProvider } from "../src/provider.js";
import { getHistoricalBaseFees } from "../src/estimator.js";
import { ethers } from "ethers";

jest.mock("../src/provider.js");
jest.mock("../src/estimator.js");

const mockGetProvider = getProvider as jest.Mock;
const mockGetHistoricalBaseFees = getHistoricalBaseFees as jest.Mock;

const mockProvider = {
  getFeeData: jest.fn(),
} as unknown as ethers.JsonRpcProvider;

mockGetProvider.mockReturnValue(mockProvider);
const mockGetFeeData = mockProvider.getFeeData as jest.Mock;

describe("optimizeFee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Scenario 1: Normal Speed (typical conditions) ---
  test("should calculate fees correctly using EWMA and normal speed profile", async () => {
    // Mock: Base Fee (EWMA = 10 Gwei)
    mockGetHistoricalBaseFees.mockResolvedValue(Array(10).fill(10));
    // Mock: Observed Tip = 5 Gwei
    mockGetFeeData.mockResolvedValue({
      maxPriorityFeePerGas: BigInt(5e9),
    } as ethers.FeeData);

    // Expected: (Max(5, 2) * 1.0 * 0.85 = 4.25) -> Max Fee = 10 + 4.25 = 14.25
    const expectedPriorityFee = 4.25;
    const expectedMaxFee = 14.25;

    const result = await optimizeFee({ speed: "normal" });

    expect(result.maxPriorityFeePerGas).toBeCloseTo(expectedPriorityFee, 2);
    expect(result.maxFeePerGas).toBeCloseTo(expectedMaxFee, 2);
  });

  // --- Scenario 2: Apply Minimum Priority Fee Floor ---
  test("should apply MIN_PRIORITY_FEE_GWEI (2 Gwei) when observed tip is low", async () => {
    // Mock: Base Fee (EWMA = 10 Gwei)
    mockGetHistoricalBaseFees.mockResolvedValue([10]);
    // Mock: Observed Tip = 1 Gwei (should hit 2 Gwei minimum)
    mockGetFeeData.mockResolvedValue({
      maxPriorityFeePerGas: BigInt(1e9),
    } as ethers.FeeData);

    // Expected value (Slow Profile: 2 Gwei Minimum * 0.75 * 0.7)
    const expectedPriorityFee = 2 * 0.75 * 0.7; // 1.05 Gwei
    const expectedMaxFee = 10 + expectedPriorityFee; // 11.05 Gwei

    const result = await optimizeFee({ speed: "slow" });

    expect(result.maxPriorityFeePerGas).toBeCloseTo(expectedPriorityFee, 2);
    expect(result.maxFeePerGas).toBeCloseTo(expectedMaxFee, 2);
  });

  // --- Scenario 3: Ensure MIN_MAX_FEE_GWEI is enforced ---
  test("should ensure Max Fee is at least MIN_MAX_FEE_GWEI (2 Gwei)", async () => {
    // Mock: EWMA + Priority Fee sum less than 2 Gwei
    mockGetHistoricalBaseFees.mockResolvedValue([0.5]); // EWMA = 0.5
    mockGetFeeData.mockResolvedValue({
      maxPriorityFeePerGas: BigInt(500000000),
    } as ethers.FeeData); // Observed Tip = 0.5 Gwei

    // Expected: Actual calculation = 0.7625 Gwei, but MIN_MAX_FEE_GWEI = 2 Gwei applied
    const expectedPriorityFee = 1.05;
    const expectedMaxFee = 2; // Adjusted to MIN_MAX_FEE_GWEI

    const result = await optimizeFee({ speed: "slow" });

    // Check if Max Fee is capped at 2 Gwei
    expect(result.maxFeePerGas).toBe(expectedMaxFee);
    // Verify priority fee is returned as calculated
    expect(result.maxPriorityFeePerGas).toBeCloseTo(expectedPriorityFee, 4);
  });

  // --- Scenario 4: Error handling ---
  test("should throw an error if no baseFee data is available", async () => {
    mockGetHistoricalBaseFees.mockResolvedValue([]);
    await expect(optimizeFee()).rejects.toThrow("No baseFee data available");
  });
});
