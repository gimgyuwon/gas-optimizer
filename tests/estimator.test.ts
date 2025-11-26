import { getHistoricalBaseFees } from "../src/estimator.js";
import { getProvider } from "../src/provider.js";

jest.mock("../src/provider");

describe("getHistoricalBaseFees", () => {
  const mockGetBlock = jest.fn();

  beforeAll(() => {
    (getProvider as jest.Mock).mockReturnValue({
      getBlock: mockGetBlock,
    });
  });

  beforeEach(() => {
    mockGetBlock.mockReset();
  });

  it("should return base fees in Gwei for recent blocks", async () => {
    const blocks = [
      { number: 100, baseFeePerGas: 2000000000n },
      { number: 99, baseFeePerGas: 3000000000n },
      { number: 98, baseFeePerGas: 4000000000n },
    ];

    mockGetBlock.mockImplementation((blockNumber: number | string) => {
      if (blockNumber === "latest") return Promise.resolve(blocks[0]);
      return Promise.resolve(blocks.find((b) => b.number === blockNumber));
    });

    const result = await getHistoricalBaseFees("fake-rpc", 3);

    expect(result).toEqual([2, 3, 4]);
    expect(mockGetBlock).toHaveBeenCalledTimes(4);
  });

  it("should throw error if latest block is not fetched", async () => {
    mockGetBlock.mockResolvedValue(null);

    await expect(getHistoricalBaseFees("fake-rpc")).rejects.toThrow(
      "Failed to fetch latest block"
    );
  });
});
