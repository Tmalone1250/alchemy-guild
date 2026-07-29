import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const VAULT_ADDRESS = "0x38DF852703420c804535d7Cf1DD3C0aCe36DDF47";
const BOT_PK = process.env.BOT_PRIVATE_KEY!;

const VAULT_ABI = ["function harvestAndDistribute() external"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PK, provider);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);

    try {
        console.log("Simulating harvestAndDistribute...");
        const result = await vault.harvestAndDistribute.staticCall();
        console.log("Simulation SUCCESS!");
    } catch (e: any) {
        console.error("Simulation FAILED!");
        console.error("Error Name:", e.errorName);
        console.error("Error Args:", e.errorArgs);
        console.error("Error Message:", e.message);
        if (e.data) {
            console.error("Revert Data:", e.data);
        }
    }
}

main().catch(console.error);
