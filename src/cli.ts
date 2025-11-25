import "dotenv/config";
import { optimizeFee } from "./optimizer.js";

async function main() {
  const url = process.env.RPC_URL;

  const result = await optimizeFee("normal", url);

  console.log("result:", result);
}

main().catch(console.error);
