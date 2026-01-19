import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const VAULT_ADDRESS = "0xEB118d8E3dB55fA1a2764A8A7144905B26680c68";

const VAULT_ABI = ["function owner() view returns (address)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    const owner = await vault.owner();

    console.log("\n=== YieldVault Ownership Check ===");
    console.log(`Vault Address: ${VAULT_ADDRESS}`);
    console.log(`Current Owner: ${owner}`);
    console.log(`Bot Wallet:    ${wallet.address}`);
    console.log(`\nMatch: ${owner.toLowerCase() === wallet.address.toLowerCase() ? "✅ YES - Bot can call rebalance()" : "❌ NO - Transfer ownership required!"}`);

    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        console.log(`\n🔧 FIX: Use Etherscan to transfer ownership from ${owner} to ${wallet.address}`);
        console.log(`URL: https://sepolia.etherscan.io/address/${VAULT_ADDRESS}#writeContract`);
    }
}

main().catch(console.error);
