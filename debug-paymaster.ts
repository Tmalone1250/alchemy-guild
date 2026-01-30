import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { CONTRACTS } from "./src/config/contracts";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PAYMASTER_ADDRESS = "0x353A1d7795bAdA4727179c09216b0e7DEE8B83D3";

// Minimal Paymaster ABI
const PAYMASTER_ABI = [
    "function sponsoredContracts(address) view returns (bool)",
    "function getDeposit() view returns (uint256)",
    "function owner() view returns (address)"
];

async function main() {
    if (!PRIVATE_KEY || !RPC_URL) throw new Error("Missing env vars");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`\n🔍 Diagnosing Paymaster: ${PAYMASTER_ADDRESS}`);
    console.log(`User: ${wallet.address}`);

    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, wallet);

    // 1. Check Ownership
    try {
        const owner = await paymaster.owner();
        console.log(`Owner: ${owner} ${owner === wallet.address ? "✅ (You)" : "❌ (Not You)"}`);
    } catch (e) { console.error("Failed to fetch owner", e); }

    // 2. Check Deposit
    try {
        const deposit = await paymaster.getDeposit();
        console.log(`Deposit: ${ethers.formatEther(deposit)} ETH`);
        if (deposit < ethers.parseEther("0.1")) console.warn("⚠️ Low Deposit!");
    } catch (e) { console.error("Failed to fetch deposit", e); }

    // 3. Check Whitelist (ElementNFT)
    const target = CONTRACTS.ElementNFT.address;
    try {
        const isWhitelisted = await paymaster.sponsoredContracts(target);
        console.log(`ElementNFT (${target}): ${isWhitelisted ? "✅ Sponsored" : "❌ NOT Sponsored"}`);
    } catch (e) {
        console.error("Failed to check whitelist", e); 
    }
    
    // 4. Check Whitelist (Alchemist)
    const alchemist = CONTRACTS.Alchemist.address;
    try {
        const isWhitelisted = await paymaster.sponsoredContracts(alchemist);
        console.log(`Alchemist (${alchemist}): ${isWhitelisted ? "✅ Sponsored" : "❌ NOT Sponsored"}`);
    } catch (e) {
         console.error("Failed to check whitelist", e);
    }
}

main().catch(console.error);
