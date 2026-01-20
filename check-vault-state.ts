import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0x974EE0295be5524c98D2edE3844bA320911c99eE";

const VAULT_ABI = [
    "function sLastPositionId() view returns (uint256)",
    "function sAccRewardPerWeight() view returns (uint256)",
    "function sTotalWeight() view returns (uint256)",
    "function sRewardDebt(uint256) view returns (uint256)",
    "function sStakedTier(uint256) view returns (uint8)",
    "function getPendingReward(uint256) view returns (uint256)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    console.log("\n🔍 YieldVault State Check\n");

    const positionId = await vault.sLastPositionId();
    const accRewardPerWeight = await vault.sAccRewardPerWeight();
    const totalWeight = await vault.sTotalWeight();

    console.log(`Last Position ID:      ${positionId}`);
    console.log(`Acc Reward Per Weight: ${accRewardPerWeight}`);
    console.log(`Total Staked Weight:   ${totalWeight}\n`);

    if (accRewardPerWeight === 0n) {
        console.log("⚠️  Acc Reward Per Weight is 0!");
        console.log("   This means either:");
        console.log("   1. No rebalances have succeeded yet");
        console.log("   2. The rebalance succeeded but fee0 was 0 (no fees collected)");
        console.log("   3. The tax/distribution logic is still buggy\n");
    }

    if (positionId === 0n) {
        console.log("ℹ️  No Uniswap position yet");
    } else {
        console.log(`✅ Uniswap position exists: NFT #${positionId}\n`);
    }

    // Check specific token IDs if provided
    const tokenIds = process.argv.slice(2);
    if (tokenIds.length > 0) {
        console.log("📊 Token Details:\n");
        for (const tokenId of tokenIds) {
            const tier = await vault.sStakedTier(tokenId);
            const rewardDebt = await vault.sRewardDebt(tokenId);
            const pending = await vault.getPendingReward(tokenId);

            console.log(`Token #${tokenId}:`);
            console.log(`  Tier:         ${tier}`);
            console.log(`  Reward Debt:  ${rewardDebt}`);
            console.log(`  Pending:      ${ethers.formatUnits(pending, 6)} USDC\n`);
        }
    } else {
        console.log("💡 Tip: Pass token IDs as arguments to check specific NFTs");
        console.log("   Example: npx tsx check-vault-state.ts 1 2");
    }
}

main().catch(console.error);
