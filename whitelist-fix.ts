
import { ethers } from "ethers";
import { PAYMASTER_ADDRESS, CONTRACTS } from "./src/config/contracts.js";
import { readFileSync } from "fs";
import 'dotenv/config';

const PAYMASTER_ABI = [
    "function sponsoredContracts(address) external view returns (bool)",
    "function setSponsoredContract(address target, bool allowed) external"
];

async function main() {
    console.log("🛠 Fix Paymaster Whitelist...");
    
    // Setup Provider & Wallet
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("Wallet:", wallet.address);

    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, wallet);
    const vaultAddress = CONTRACTS.YieldVault.address;

    // 1. Check current status
    const isSponsored = await paymaster.sponsoredContracts(vaultAddress);
    console.log(`Current Status for YieldVault (${vaultAddress}): ${isSponsored}`);

    if (isSponsored) {
        console.log("✅ Already whitelisted. No action needed.");
        return;
    }

    // 2. Whitelist if needed
    console.log("⚠️ Not whitelisted. Sending transaction...");
    const tx = await paymaster.setSponsoredContract(vaultAddress, true);
    console.log("Transaction sent:", tx.hash);
    
    await tx.wait();
    console.log("✅ Transaction confirmed!");

    // 3. Verify
    const isSponsoredNow = await paymaster.sponsoredContracts(vaultAddress);
    console.log(`New Status: ${isSponsoredNow}`);
}

main().catch(console.error);
