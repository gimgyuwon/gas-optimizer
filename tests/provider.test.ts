import { getProvider } from "../src/provider.js";
import { ethers } from "ethers";

// Store the original environment variables to restore them after testing.
const ORIGINAL_ENV = process.env;

/**
 * Executes a cleanup before and after tests to ensure environment isolation.
 * This is crucial for testing functions that rely on process.env.
 */
describe("getProvider", () => {
  // Backup and reset environment variables before each test.
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  // Restore the original environment variables after all tests in this suite are complete.
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  // Test Case 1: Argument should override environment variable.
  test("should create a provider when RPC URL is passed as an argument", () => {
    const mockUrl = "http://test-rpc-arg.com";

    // Set a dummy ENV variable that should be ignored by the function's logic.
    process.env.RPC_URL = "http://should-be-ignored.com";

    // ACT: Call the function with an explicit argument.
    const provider = getProvider(mockUrl);

    // Use type assertion to access the internal connection URL for verification (ethers v6).
    const rpcUrl = (provider as any)._getConnection().url;

    // ASSERT 1: Verify the returned object is the correct type.
    expect(provider).toBeInstanceOf(ethers.JsonRpcProvider);

    // ASSERT 2: Verify the argument URL was used, ignoring the ENV variable.
    expect(rpcUrl).toBe(mockUrl);
  });

  // Test Case 2: Function should fall back to environment variable.
  test("should create a provider when RPC URL is in environment variables", () => {
    const envUrl = "http://test-rpc-env.com";
    process.env.RPC_URL = envUrl; // Setup the ENV variable.

    // ACT: Call the function without arguments.
    const provider = getProvider();
    const rpcUrl = (provider as any)._getConnection().url;

    // ASSERT 1: Verify the type.
    expect(provider).toBeInstanceOf(ethers.JsonRpcProvider);

    // ASSERT 2: Verify the ENV URL was correctly used.
    expect(rpcUrl).toBe(envUrl);
  });

  // Test Case 3: Function should handle missing configuration gracefully.
  test("should throw an error if no RPC URL is provided", () => {
    // Clear the environment variable.
    delete process.env.RPC_URL;

    // ASSERT: Verify the function throws the expected error when both argument and ENV are missing.
    expect(() => getProvider()).toThrow("RPC URL is not provided!");
  });
});
