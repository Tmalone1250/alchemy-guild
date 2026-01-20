import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0x9aa6602838B525175A4738cf0A894Cf9dC67f580";

const VAULT_ABI = [
    "function sAccRewardPerWeight() view returns (uint256)",
    "function sTotalWeight() view returns (uint256)",
    "function sLastPositionId() view returns (uint256)",
    "function getPendingReward(uint256) view returns (uint256)",
    "function sStakedTier(uint256) view returns (uint8)",
    "function sRewardDebt(uint256) view returns (uint256)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    console.log("\n📊 Reward Distribution Diagnostic\n");

    const accRewardPerWeight = await vault.sAccRewardPerWeight();
    const totalWeight = await vault.sTotalWeight();
    const positionId = await vault.sLastPositionId();

    console.log(`Acc Reward Per Weight: ${accRewardPerWeight}`);
    console.log(`Total Staked Weight:   ${totalWeight}`);
    console.log(`Last Position ID:      ${positionId}\n`);

    if (accRewardPerWeight === 0n) {
        console.log("❌ No rewards accumulated yet!");
        console.log("\n   This means:");
        console.log("   1. Rebalance succeeded but collected 0 USDC fees");
        console.log("   2. OR the fee distribution logic has a bug");
        console.log("\n   Since we disabled WETH swap, only USDC fees are distributed.");
        console.log("   If the Uniswap position mostly earned WETH fees, there's nothing to distribute!");
        console.log("\n   Solution: The position needs more trading volume to generate USDC fees.");
    } else {
        console.log("✅ Rewards are being accumulated!");
        console.log(`   Reward per unit weight: ${ethers.formatUnits(accRewardPerWeight, 6 + 18)} USDC`);
    }

    // Check specific token IDs (pass as CLI args)
    const tokenIds = process.argv.slice(2);
    if (tokenIds.length > 0) {
        console.log("\n📋 Staked NFT Details:\n");
        for (const tokenId of tokenIds) {
            try {
                const tier = await vault.sStakedTier(tokenId);
                const rewardDebt = await vault.sRewardDebt(tokenId);
                const pending = await vault.getPendingReward(tokenId);

                console.log(`Token #${tokenId}:`);
                console.log(`  Tier:          ${tier}`);
                console.log(`  Reward Debt:   ${rewardDebt}`);
                console.log(`  Pending:       ${ethers.formatUnits(pending, 6)} USDC`);

                if (pending === 0n) {
                    console.log(`  Status:        ❌ No rewards to claim`);
                } else {
                    console.log(`  Status:        ✅ ${ethers.formatUnits(pending, 6)} USDC ready to claim!`);
                }
                console.log();
            } catch (error) {
                console.log(`Token #${tokenId}: Not staked or doesn't exist\n`);
            }
        }
    } else {
        console.log("\n💡 Tip: Pass token IDs to check specific NFTs");
        console.log("   Example: npx tsx check-rewards.ts 1 2 3");
    }
}

main().catch(console.error);
