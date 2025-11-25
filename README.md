# gas-optimizer

Ethereum transaction fee optimizer for fast, reliable, and budget-aware transactions. Automatically calculates optimal `maxFeePerGas` and `maxPriorityFeePerGas`.

## Features

- Optimize gas fees for different speeds: `slow`, `normal`, `fast`
- Optional max budget for gas cost
- Send transactions using private key
- Works with Ethereum testnets and mainnet
- Server-side usage only

## Installation

```bash
npm install gas-optimizer
```

## Environment Variables

Create a `.env` file:

```env
RPC_URL=https://your_rpc_url
REC_ADDR=0xRecipientAddress
PRIVATE_KEY=your_private_key
```

## CLI Usage

```bash
npx gas-optimizer
```

or, if installed locally:

```bash
npm run cli
```

This will:

1. Fetch network gas data
2. Optimize fees based on speed
3. Send a transaction with calculated fees

## API Usage

```ts
import { sendOptimizedTransaction } from "gas-optimizer";
import { ethers } from "ethers";

const txResponse = await sendOptimizedTransaction(
  {
    to: "0xRecipientAddress",
    value: ethers.parseEther("0.001"),
  },
  {
    speed: "fast",
    rpcUrl: process.env.RPC_URL!,
    privateKey: process.env.PRIVATE_KEY!,
    maxBudget: 5_000_000_000_000_000n, // optional
  }
);

console.log("Transaction sent:", txResponse);
```

## Options

| Speed  | Blocks | Alpha | Priority Multiplier | Percentile |
| ------ | ------ | ----- | ------------------- | ---------- |
| slow   | 15     | 0.2   | 0.75                | 0.7        |
| normal | 10     | 0.3   | 1.0                 | 0.85       |
| fast   | 5      | 0.5   | 1.5                 | 0.95       |

## License

ISC
