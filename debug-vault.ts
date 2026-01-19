import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const VAULT_ADDRESS = "0x9ab52Cb41Ab33c3622639Eff60D1b4d60792E751";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const VAULT_ABI = [
    "function owner() view returns (address)",
    "function rebalance() external",
    "function sTotalWeight() view returns (uint256)",
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

    console.log("🔍 Debugging YieldVault Rebalance\n");

    // 1. Check ownership
    const owner = await vault.owner();
    console.log(`1️⃣ Vault Owner: ${owner}`);
    console.log(`   Bot Wallet:  ${wallet.address}`);
    console.log(`   Match: ${owner.toLowerCase() === wallet.address.toLowerCase() ? "✅ YES" : "❌ NO"}\n`);

    // 2. Check vault balances
    const vaultWeth = await weth.balanceOf(VAULT_ADDRESS);
    const vaultUsdc = await usdc.balanceOf(VAULT_ADDRESS);
    console.log(`2️⃣ Vault Balances:`);
    console.log(`   WETH: ${ethers.formatEther(vaultWeth)} (${vaultWeth})`);
    console.log(`   USDC: ${ethers.formatUnits(vaultUsdc, 6)} (${vaultUsdc})\n`);

    // 3. Check total weight
    const totalWeight = await vault.sTotalWeight();
    console.log(`3️⃣ Total Staked Weight: ${totalWeight}\n`);

    // 4. Check bot wallet balances
    const botWeth = await weth.balanceOf(wallet.address);
    const botUsdc = await usdc.balanceOf(wallet.address);
    console.log(`4️⃣ Bot Wallet Balances:`);
    console.log(`   WETH: ${ethers.formatEther(botWeth)}`);
    console.log(`   USDC: ${ethers.formatUnits(botUsdc, 6)}\n`);

    // 5. Try to simulate rebalance
    console.log(`5️⃣ Simulating rebalance() call...`);
    try {
        // Use callStatic to simulate without sending a transaction
        await vault.rebalance.staticCall();
        console.log(`   ✅ Simulation SUCCESS - rebalance should work!\n`);
    } catch (error: any) {
        console.log(`   ❌ Simulation FAILED`);
        console.log(`   Error: ${error.message || error}\n`);

        // Try to decode the error
        if (error.data) {
            console.log(`   Error Data: ${error.data}`);
        }
    }

    console.log("\n📊 Diagnosis:");
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        console.log("❌ ISSUE: Bot wallet does not own the Vault!");
        console.log("   FIX: Transfer ownership to bot wallet");
    } else if (vaultWeth === 0n && vaultUsdc === 0n) {
        console.log("⚠️  ISSUE: Vault is empty (no WETH or USDC)");
        console.log("   FIX: The bot's auto-seeding should handle this");
    } else {
        console.log("✅ Ownership and balances look OK. Check simulation error above.");
    }
}

main().catch(console.error);
