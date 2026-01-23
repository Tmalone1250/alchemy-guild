import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0xFff8e4da589f15453e73004b65c61Da341B9075C";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

const provider = new ethers.JsonRpcProvider(RPC_URL);

const VAULT_ABI = [
    "function sLastPositionId() view returns (uint256)",
    "function sAccRewardPerWeight() view returns (uint256)",
    "function sTotalWeight() view returns (uint256)"
];

async function main() {
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, ["function balanceOf(address) view returns (uint256)"], provider);
    const weth = new ethers.Contract(WETH_ADDRESS, ["function balanceOf(address) view returns (uint256)"], provider);

    console.log("🔍 Detailed Vault State\n");
    console.log(`Vault: ${VAULT_ADDRESS}\n`);

    const [usdcBal, wethBal, positionId, accReward, totalWeight] = await Promise.all([
        usdc.balanceOf(VAULT_ADDRESS),
        weth.balanceOf(VAULT_ADDRESS),
        vault.sLastPositionId(),
        vault.sAccRewardPerWeight(),
        vault.sTotalWeight()
    ]);

    console.log("💰 Balances:");
    console.log(`  USDC: ${ethers.formatUnits(usdcBal, 6)} USDC`);
    console.log(`  WETH: ${ethers.formatEther(wethBal)} WETH\n`);

    console.log("🌐 Global State:");
    console.log(`  sLastPositionId: ${positionId.toString()}`);
    console.log(`  sAccRewardPerWeight: ${ethers.formatUnits(accReward, 18)}`);
    console.log(`  sTotalWeight: ${totalWeight.toString()}\n`);

    // Check if position ID changed (would indicate multiple positions being created)
    if (positionId === 0n) {
        console.log("⚠️  No position created yet (expected on first deploy before first rebalance)");
    } else {
        console.log(`✅ Position ID exists: ${positionId.toString()}`);
        console.log("   Run this script again after next rebalance to see if ID changes");
    }
}

main().catch(console.error);
