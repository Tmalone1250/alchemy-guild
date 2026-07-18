import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;         // Current Owner (Windows/Node)
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY; // New Owner (Bot/WSL)
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;

const ABI = [
    "function transferOwnership(address newOwner) external",
    "function owner() view returns (address)"
];

async function main() {
    if (!PRIVATE_KEY || !BOT_PRIVATE_KEY) {
        console.error("❌ Missing Keys in .env");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const ownerWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const botWallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider); 
    const vault = new ethers.Contract(VAULT_ADDRESS, ABI, ownerWallet);

    console.log(`\n👑 Transferring Ownership of ${VAULT_ADDRESS}`);
    console.log(`   From: ${ownerWallet.address} (You/Signer)`);
    console.log(`   To:   ${botWallet.address} (Bot)`);

    try {
        const currentOwner = await vault.owner();
        if (currentOwner.toLowerCase() !== ownerWallet.address.toLowerCase()) {
            console.error(`\n❌ You are NOT the owner. Checking if check-owner script was right...`);
            console.error(`   Actual Owner: ${currentOwner}`);
            return;
        }

        console.log("\n🚀 Sending transferOwnership()...");
        const tx = await vault.transferOwnership(botWallet.address);
        console.log(`   Tx: ${tx.hash}`);
        await tx.wait();
        
        console.log("\n✅ Ownership Transferred!");
        console.log("   The Bot can now call 'rebalance()'.");

    } catch (e: any) {
        console.error("❌ Transfer Failed:", e.message);
    }
}

main().catch(console.error);
