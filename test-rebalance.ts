import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const VAULT_ADDRESS = "0xC2e73bD133a9eB6517EDc342F0B86AAfeE61EAa9";

const VAULT_ABI = ["function rebalance() external"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);

    console.log("\n🔥 Testing rebalance() call...\n");

    try {
        const tx = await vault.rebalance({ gasLimit: 2000000 });
        console.log(`✅ Transaction sent: ${tx.hash}`);
        console.log("⏳ Waiting for confirmation...");

        const receipt = await tx.wait();
        console.log(`\n🎉 SUCCESS! Rebalance completed in block ${receipt.blockNumber}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`   Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
    } catch (error: any) {
        console.log("\n❌ Rebalance failed:");
        console.log(error.message || error);
    }
}

main().catch(console.error);
