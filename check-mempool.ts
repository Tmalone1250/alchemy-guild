import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();
const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

    console.log(`Checking account: ${wallet.address}`);

    const latest = await provider.getTransactionCount(wallet.address, "latest");
    const pending = await provider.getTransactionCount(wallet.address, "pending");

    console.log(`Latest Nonce (Mined): ${latest}`);
    console.log(`Pending Nonce (Mempool): ${pending}`);
    console.log(`In-flight Transactions: ${pending - latest}`);

    if (pending > latest) {
        console.log("\n⚠️ WARNING: You have pending transactions that are stuck!");
        console.log("This is likely why the public RPC is rejecting new ones.");
        console.log("These nonces are locked: " + Array.from({ length: pending - latest }, (_, i) => latest + i).join(", "));
    } else {
        console.log("\n✅ Mempool is clear. The error might be pure rate-limiting from the public RPC.");
    }
}
main().catch(console.error);
