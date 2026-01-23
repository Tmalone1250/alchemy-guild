import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const YIELD_VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';

async function checkAllStakedNFTs() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);

    const vaultAbi = [
        "event Staked(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 weight)",
        "event Unstaked(address indexed user, uint256 indexed tokenId,uint256 reward)",
        "function getPendingReward(uint256) view returns (uint256)",
        "function sRewardDebt(uint256) view returns (uint256)",
        "function sAccRewardPerWeight() view returns (uint256)",
        "function sNftOwner(uint256) view returns (address)",
        "function sTotalWeight() view returns (uint256)"
    ];

    const vault = new ethers.Contract(YIELD_VAULT_ADDRESS, vaultAbi, provider);

    let output = '\n🔍 Checking All Staked NFTs\n' + '='.repeat(70) + '\n\n';

    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 40000;

    const stakedEvents = await vault.queryFilter(vault.filters.Staked(), fromBlock, currentBlock);
    const unstakedEvents = await vault.queryFilter(vault.filters.Unstaked(), fromBlock, currentBlock);

    const staked = new Map();
    for (const event of stakedEvents) {
        const tokenId = event.args[1].toString();
        staked.set(tokenId, { user: event.args[0], tier: event.args[2] });
    }

    for (const event of unstakedEvents) {
        const tokenId = event.args[1].toString();
        staked.delete(tokenId);
    }

    output += `Found ${staked.size} currently staked NFTs\n\n`;

    const accRewardPerWeight = await vault.sAccRewardPerWeight();
    const totalWeight = await vault.sTotalWeight();

    output += `Global State:\n`;
    output += `  sAccRewardPerWeight: ${accRewardPerWeight} (${ethers.formatUnits(accRewardPerWeight, 18)} in ether units)\n`;
    output += `  sTotalWeight: ${totalWeight}\n\n`;

    for (const [tokenId, info] of staked) {
        const owner = await vault.sNftOwner(tokenId);
        if (owner === ethers.ZeroAddress) continue;

        const pending = await vault.getPendingReward(tokenId);
        const rewardDebt = await vault.sRewardDebt(tokenId);

        output += `Token ID ${tokenId}:\n`;
        output += `  Owner: ${info.user}\n`;
        output += `  Tier: ${info.tier}\n`;
        output += `  Pending (raw): ${pending}\n`;
        output += `  Pending (USDC 6 decimals): ${ethers.formatUnits(pending, 6)} USDC\n`;
        output += `  Reward Debt (raw): ${rewardDebt}\n`;
        output += `  Reward Debt (18 decimals): ${ethers.formatUnits(rewardDebt, 18)}\n`;
        output += `  Difference (raw): ${accRewardPerWeight > rewardDebt ? accRewardPerWeight - rewardDebt : 0n}\n`;

        if (rewardDebt === 0n) {
            output += `  ⚠️ CRITICAL: Reward debt is ZERO!\n`;
        } else if (pending > 1000000n) { // More than 1 USDC (6 decimals)
            output += `  ⚠️ WARNING: Pending reward seems very high!\n`;
        }
        output += '\n';
    }

    fs.writeFileSync('reward-debt-diagnostic.txt', output);
    console.log(output);
    console.log('\n✅ Output saved to reward-debt-diagnostic.txt');
}

checkAllStakedNFTs().catch(console.error);
