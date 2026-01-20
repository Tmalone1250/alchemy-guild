import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0x7C7F4f4F263dC857e0ad3E5681eaaB327b00E3f6"; // From error message
const BOT_WALLET = "0xd83B5031506039893BF1C827b0A79aDDee71E1fE";

const VAULT_ABI = [
    "function owner() view returns (address)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    console.log("\n🔍 Checking Vault Ownership\n");
    console.log(`Vault Address: ${VAULT_ADDRESS}`);
    console.log(`Bot Wallet:    ${BOT_WALLET}\n`);

    try {
        const owner = await vault.owner();
        console.log(`Current Owner: ${owner}\n`);

        if (owner.toLowerCase() === BOT_WALLET.toLowerCase()) {
            console.log("✅ Ownership is correct - bot owns the vault");
            console.log("\n   But rebalance is still failing with low gas (21,392)");
            console.log("   This suggests a different early check is failing");
            console.log("   Possible causes:");
            console.log("   1. Vault is locked (nonReentrant issue)");
            console.log("   2. Function signature mismatch");
            console.log("   3. Gas limit too low");
        } else {
            console.log("❌ OWNERSHIP PROBLEM!");
            console.log(`   Expected: ${BOT_WALLET}`);
            console.log(`   Actual:   ${owner}`);
            console.log("\n   You need to transfer ownership:");
            console.log("   1. Go to Etherscan");
            console.log("   2. Connect wallet that owns vault");
            console.log(`   3. Call transferOwnership(${BOT_WALLET})`);
        }
    } catch (error: any) {
        console.log("❌ Error reading vault:");
        console.log(`   ${error.message || error}`);
        console.log("\n   The vault address might be incorrect");
    }
}

main().catch(console.error);
