import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const YIELD_VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';
const YOUR_WALLET = '0xd83B5031506039893BF1C827b0A79aDDee71E1fE'; // Bot wallet

const YIELD_VAULT_ABI = [
    "function sUserStakedTokens(address, uint256) view returns (uint256)",
    "function getPendingReward(uint256) view returns (uint256)",
    "function sRewardDebt(uint256) view returns (uint256)",
    "function sAccRewardPerWeight() view returns (uint256)"
];

async function findStakedNFTs() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);
    const vault = new ethers.Contract(YIELD_VAULT_ADDRESS, YIELD_VAULT_ABI, provider);

    console.log(`\n🔍 Finding staked NFTs for: ${YOUR_WALLET}`);
    console.log('='.repeat(60));

    const stakedTokens = [];

    // Try to find staked tokens (EnumerableSet doesn't have a direct getter)
    // We'll need to check recent Staked events instead
    const eventFilter = vault.filters.Staked(YOUR_WALLET);
    const events = await vault.queryFilter(eventFilter, -40000);

    console.log(`\nFound ${events.length} staking events`);

    for (const event of events) {
        const tokenId = event.args![1];
        const pending = await vault.getPendingReward(tokenId);
        const rewardDebt = await vault.sRewardDebt(tokenId);
        const accRewardPerWeight = await vault.sAccRewardPerWeight();

        console.log(`\n📍 Token ID: ${tokenId}`);
        console.log(`   Pending: ${ethers.formatUnits(pending, 6)} USDC`);
        console.log(`   Reward Debt: ${ethers.formatUnits(rewardDebt, 18)}`);
        console.log(`   Acc Reward/Weight: ${ethers.formatUnits(accRewardPerWeight, 18)}`);

        if (rewardDebt === 0n) {
            console.log(`   ⚠️  WARNING: Reward debt is 0!`);
        }
    }
}

findStakedNFTs().catch(console.error);
