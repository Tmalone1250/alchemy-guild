import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const POSITION_MANAGER = "0x1238536071E1c677A632429e3655c799b22cDA52";

const VAULT_ABI = [
    "function sLastPositionId() view returns (uint256)",
    "function sAccRewardPerWeight() view returns (uint256)",
    "function sTotalWeight() view returns (uint256)",
];

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

    console.log("\n🔍 Full Vault Diagnostic\n");
    console.log(`Vault: ${VAULT_ADDRESS}\n`);

    // Get vault state
    const positionId = await vault.sLastPositionId();
    const accReward = await vault.sAccRewardPerWeight();
    const totalWeight = await vault.sTotalWeight();

    console.log("📊 Vault State:");
    console.log(`   Position ID:       ${positionId}`);
    console.log(`   Acc Reward:        ${accReward}`);
    console.log(`   Total Weight:      ${totalWeight}\n`);

    if (positionId === 0n) {
        console.log("❌ CRITICAL: No Uniswap position exists!");
        console.log("   Rebalances are not creating positions\n");
    } else {
        console.log(`✅ Position exists: NFT #${positionId}\n`);
    }

    // Get vault balances
    const wethBalance = await weth.balanceOf(VAULT_ADDRESS);
    const usdcBalance = await usdc.balanceOf(VAULT_ADDRESS);

    console.log("💰 Vault Balances:");
    console.log(`   WETH: ${ethers.formatEther(wethBalance)}`);
    console.log(`   USDC: ${ethers.formatUnits(usdcBalance, 6)}\n`);

    if (wethBalance === 0n && usdcBalance === 0n) {
        console.log("❌ Vault is EMPTY - needs seeding!");
    } else if (wethBalance < ethers.parseEther("0.01") || usdcBalance < ethers.parseUnits("10", 6)) {
        console.log("⚠️  Vault has low balances - might be too small for position");
    }

    // Calculate what would be deposited with 20% reserve
    const usdcForPosition = (usdcBalance * 80n) / 100n;
    console.log("\n📐 With 20% Reserve:");
    console.log(`   USDC for position: ${ethers.formatUnits(usdcForPosition, 6)}`);
    console.log(`   USDC reserved:     ${ethers.formatUnits(usdcBalance - usdcForPosition, 6)}\n`);

    if (usdcForPosition < ethers.parseUnits("1", 6)) {
        console.log("❌ PROBLEM: After 20% reserve, less than 1 USDC left for position!");
        console.log("   Uniswap likely rejects positions that are too small\n");
        console.log("💡 SOLUTIONS:");
        console.log("   1. Reduce reserve to 10% instead of 20%");
        console.log("   2. Seed vault with more USDC (>100 USDC)");
        console.log("   3. Remove reserve entirely until vault has more funds");
    }
}

main().catch(console.error);
