import "dotenv/config";
import { sendOptimizedTransaction } from "./sender.js";
import { ethers } from "ethers";

/**
 * Main function to demonstrate optimized transaction sending.
 * It loads configuration from environment variables, defines the transaction,
 * and sends it using the calculated Max Fee and Gas Limit.
 */
async function main() {
  const rpcUrl = process.env.RPC_URL;
  const recipientAddr = process.env.REC_ADDR;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !recipientAddr || !privateKey) {
    console.error("Missing RPC_URL, REC_ADDR, or PRIVATE_KEY in .env");
    process.exit(1);
  }

  const txDetails = {
    to: recipientAddr,
    value: ethers.parseEther("0.001"),
  };

  const sendOptions = {
    speed: "fast" as "fast",
    rpcUrl: rpcUrl,
    privateKey: privateKey,
    // Optional: Uncomment to enforce a maximum total cost (e.g., 0.01 ETH)
    maxBudget: ethers.parseEther("0.01"),
  };

  console.log(
    `Sending ${ethers.formatEther(txDetails.value)} ETH to ${txDetails.to}...`
  );

  const txResponse = await sendOptimizedTransaction(txDetails, sendOptions);

  console.log("--- Transaction Sent ---");
  console.log(`Hash: ${txResponse.hash}`);
}

main().catch((error) => {
  console.error("Transaction execution failed:");
  console.error(error);
  process.exit(1);
});
