import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

// This script monitors the vault balance across multiple rebalances to verify no drainage occurs
const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0xDcC6FEc924E0dFbf6ebB63028AE64746EcA58F70"; // UPDATE WITH NEW ADDRESS AFTER REDEPLOYMENT
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const provider = new ethers.JsonRpcProvider(RPC_URL);

const USDC_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const VAULT_ABI = [
    "event Rebalanced(uint256 indexed positionId, uint256 wethCollected, uint256 usdcDistributed, uint256 treasuryTax)",
    "function sAccRewardPerWeight() view returns (uint256)",
    "function sTotalWeight() view returns (uint256)",
    "function sLastPositionId() view returns (uint256)"
];

async function main() {
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

    console.log("🔍 Vault Drainage Monitor\n");
    console.log("Vault Address:", VAULT_ADDRESS);
    console.log("Monitoring for drainage across rebalances...\n");

    let previousBalance = await usdc.balanceOf(VAULT_ADDRESS);
    console.log(`Initial USDC Balance: ${ethers.formatUnits(previousBalance, 6)} USDC\n`);

    let rebalanceCount = 0;

    // Listen for Rebalanced events
    vault.on("Rebalanced", async (positionId, wethCollected, usdcDistributed, treasuryTax, event) => {
        rebalanceCount++;
        const currentBalance = await usdc.balanceOf(VAULT_ADDRESS);
        const balanceChange = currentBalance - previousBalance;
        const percentChange = previousBalance > 0n
            ? (Number(balanceChange) / Number(previousBalance) * 100).toFixed(2)
            : 0;

        console.log(`\n━━━ Rebalance #${rebalanceCount} ━━━`);
        console.log(`Tx Hash: ${event.log.transactionHash}`);
        console.log(`Position ID: ${positionId}`);
        console.log(`\n💰 Balance Changes:`);
        console.log(`  Previous: ${ethers.formatUnits(previousBalance, 6)} USDC`);
        console.log(`  Current:  ${ethers.formatUnits(currentBalance, 6)} USDC`);
        console.log(`  Change:   ${balanceChange >= 0n ? '+' : ''}${ethers.formatUnits(balanceChange, 6)} USDC (${percentChange}%)`);

        console.log(`\n📊 Event Data:`);
        console.log(`  WETH Collected: ${ethers.formatEther(wethCollected)} WETH`);
        console.log(`  USDC Distributed: ${ethers.formatUnits(usdcDistributed, 6)} USDC`);
        console.log(`  Treasury Tax: ${ethers.formatUnits(treasuryTax, 6)} USDC`);

        // Check for drainage
        if (balanceChange < -1000000n) { // More than 1 USDC loss
            console.log(`\n🚨 WARNING: Vault lost ${ethers.formatUnits(-balanceChange, 6)} USDC!`);
            console.log(`   This may indicate a drainage bug!`);
        } else if (balanceChange > 0n) {
            console.log(`\n✅ GOOD: Vault balance increased (fees collected)`);
        } else {
            console.log(`\n✅ STABLE: Minimal change (expected for small fee collection)`);
        }

        // Get global state
        const accRewardPerWeight = await vault.sAccRewardPerWeight();
        const totalWeight = await vault.sTotalWeight();
        console.log(`\n🌐 Global State:`);
        console.log(`  sAccRewardPerWeight: ${ethers.formatUnits(accRewardPerWeight, 18)}`);
        console.log(`  sTotalWeight: ${totalWeight}`);

        previousBalance = currentBalance;
    });

    console.log("⏳ Waiting for Rebalanced events...\n");
    console.log("Press Ctrl+C to stop monitoring\n");
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
