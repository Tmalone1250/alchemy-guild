import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const YIELD_VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';

const YIELD_VAULT_ABI = [
    "function sRewardDebt(uint256) view returns (uint256)",
    "function sAccRewardPerWeight() view returns (uint256)",
    "function sStakedTier(uint256) view returns (uint8)",
    "function getTierWeight(uint8) view returns (uint256)",
    "function getPendingReward(uint256) view returns (uint256)"
];

async function checkRewardDebt() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);
    const vault = new ethers.Contract(YIELD_VAULT_ADDRESS, YIELD_VAULT_ABI, provider);

    // Get your token ID - replace with the NFT you're trying to claim from
    const tokenId = BigInt(process.argv[2] || '0');

    console.log(`\n🔍 Checking Token ID: ${tokenId}`);
    console.log('='.repeat(60));

    try {
        const rewardDebt = await vault.sRewardDebt(tokenId);
        const accRewardPerWeight = await vault.sAccRewardPerWeight();
        const tier = await vault.sStakedTier(tokenId);
        const pending = await vault.getPendingReward(tokenId);

        console.log(`\n📊 Reward Accounting:`);
        console.log(`   Reward Debt: ${ethers.formatUnits(rewardDebt, 18)}`);
        console.log(`   Acc Reward Per Weight: ${ethers.formatUnits(accRewardPerWeight, 18)}`);
        console.log(`   Difference: ${ethers.formatUnits(accRewardPerWeight - rewardDebt, 18)}`);
        console.log(`\n💎 NFT Info:`);
        console.log(`   Tier: ${tier}`);
        console.log(`   Pending Reward: ${ethers.formatUnits(pending, 6)} USDC`);

        if (rewardDebt === 0n) {
            console.log(`\n❌ ERROR: Reward debt is 0! This NFT was staked before reward debt was implemented.`);
            console.log(`   This causes it to claim ALL accumulated rewards since contract deployment.`);
        } else {
            console.log(`\n✅ Reward debt is properly set.`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkRewardDebt();
