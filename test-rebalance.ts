import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || process.env.VITE_INFURA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const PRIVATE_KEY = process.env.BOT_PRIVATE_KEY || process.env.PRIVATE_KEY;
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0x2Ed51bD2CD7148197C8aBbF53D171e1c8bb41CdC";

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
