import "dotenv/config";
import { optimizeFee } from "./optimizer.js";
import { sendOptimizedTransaction } from "./sender.js";
import { ethers } from "ethers";

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const recipientAddr = process.env.REC_ADDR;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !recipientAddr || !privateKey) {
    console.error("Missing RPC_URL, REC_ADDR, or PRIVATE_KEY in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const fees = await optimizeFee({ speed: "normal", rpcUrl });
  console.log("Optimized fees:", fees);

  const txResponse = await sendOptimizedTransaction(
    {
      to: recipientAddr,
      value: ethers.parseEther("0.001"),
    },
    { speed: "fast", rpcUrl, privateKey: privateKey }
  );

  console.log("Transaction sent:", txResponse);
}

main().catch(console.error);
