/**
 * Mandorla deploy script — deploys MandorlaSharedDecision to Studionet (default).
 *
 * Usage:
 *   npx ts-node deploy.ts                            # studionet (default)
 *   GENLAYER_NETWORK=localnet npx ts-node deploy.ts  # local dev
 *
 * Prerequisites:
 *   npm install genlayer-js ts-node typescript @types/node
 *
 * Studionet: https://studio.genlayer.com  (Chain ID 61999)
 *   - Get a private key from the Studio UI, set GENLAYER_PRIVATE_KEY
 *   - Faucet: click 💧 in Studio to get test GEN
 */

import { createClient, createAccount } from "genlayer-js";
import { studionet, localnet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import * as fs from "fs";
import * as path from "path";

const NETWORK = process.env.GENLAYER_NETWORK ?? "studionet";
const PRIVATE_KEY = process.env.GENLAYER_PRIVATE_KEY as `0x${string}` | undefined;
const CONTRACT_FILE = path.join(__dirname, "mandorla_shared_decision.py");

async function deploy() {
  console.log(`\n⚖  Mandorla Deploy — ${NETWORK}\n`);

  const chain = NETWORK === "localnet" ? localnet : studionet;
  const account = PRIVATE_KEY ? createAccount(PRIVATE_KEY) : createAccount();
  console.log(`Deployer address: ${account.address}`);
  const client = createClient({ chain, account });

  console.log("Initializing consensus smart contract...");
  await client.initializeConsensusSmartContract();

  const code = fs.readFileSync(CONTRACT_FILE, "utf-8");
  console.log(`Contract source: ${CONTRACT_FILE} (${code.length} bytes)`);

  console.log("Deploying...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hash: any = await client.deployContract({
    code,
    args: [],
    leaderOnly: false,
  });
  console.log(`Deploy tx hash: ${hash}`);

  console.log("Waiting for FINALIZED status...");
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 60,
    interval: 5000,
  });

  const contractAddress = receipt.data?.contract_address;
  console.log(`\n✓ Contract deployed at: ${contractAddress}\n`);
  console.log("Add to your .env.local:");
  console.log(`  NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`  NEXT_PUBLIC_GENLAYER_RPC=${chain.rpcUrls.default.http[0]}\n`);

  return contractAddress;
}

deploy().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
