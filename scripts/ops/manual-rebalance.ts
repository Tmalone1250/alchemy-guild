import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY; 
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;

const VAULT_ABI = ["function rebalance() external"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY!, provider);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);

    console.log(`\n🌪️ Triggering Rebalance on ${VAULT_ADDRESS}...`);
    console.log(`   Signer: ${wallet.address}`);

    try {
        // Estimate gas first to see if it reverts
        console.log("   Estimating Gas...");
        const gasLimit = await vault.rebalance.estimateGas();
        console.log(`   ✅ Gas Estimate: ${gasLimit.toString()}`);

        const tx = await vault.rebalance({ gasLimit: gasLimit * 120n / 100n }); // 20% buffer
        console.log(`   🚀 Tx Sent: ${tx.hash}`);
        await tx.wait();
        console.log("   ✅ Rebalance Complete!");

    } catch (e: any) {
        console.error("\n❌ REBALANCE FAILED:");
        if (e.data) {
            console.error(`   Data: ${e.data}`);
            // Attempt to decode strings
            try {
                const reason = ethers.toUtf8String("0x" + e.data.slice(138));
                console.error(`   Decoded Reason: ${reason}`);
            } catch {}
        }
        if (e.reason) {
             console.error(`   Reason: ${e.reason}`);
        }
        if (e.info && e.info.error) {
             console.error(`   Nested Error: ${e.info.error.message}`);
        }
        console.error(`   Full Error: ${e.message}`);
    }
}

main().catch(console.error);
