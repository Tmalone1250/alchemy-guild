import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const YIELD_VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';
const ELEMENT_NFT_ADDRESS = '0x14e767d025da5182c7854217617bF4a16a0c1bC8';

async function checkAllStakedNFTs() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);

    const vaultAbi = [
        "event Staked(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 weight)",
        "event Unstaked(address indexed user, uint256 indexed tokenId, uint256 reward)",
        "function getPendingReward(uint256) view returns (uint256)",
        "function sRewardDebt(uint256) view returns (uint256)",
        "function sAccRewardPerWeight() view returns (uint256)",
        "function sNftOwner(uint256) view returns (address)"
    ];

    const vault = new ethers.Contract(YIELD_VAULT_ADDRESS, vaultAbi, provider);

    console.log('\n🔍 Checking All Staked NFTs');
    console.log('='.repeat(70));

    // Get all Staked events
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 40000;

    const stakedEvents = await vault.queryFilter(
        vault.filters.Staked(),
        fromBlock,
        currentBlock
    );

    const unstakedEvents = await vault.queryFilter(
        vault.filters.Unstaked(),
        fromBlock,
        currentBlock
    );

    // Build set of currently staked tokens
    const staked = new Map();
    for (const event of stakedEvents) {
        const tokenId = event.args[1].toString();
        staked.set(tokenId, { user: event.args[0], tier: event.args[2] });
    }

    for (const event of unstakedEvents) {
        const tokenId = event.args[1].toString();
        staked.delete(tokenId);
    }

    console.log(`\nFound ${staked.size} currently staked NFTs\n`);

    const accRewardPerWeight = await vault.sAccRewardPerWeight();
    console.log(`Global sAccRewardPerWeight: ${ethers.formatUnits(accRewardPerWeight, 18)}\n`);

    for (const [tokenId, info] of staked) {
        const owner = await vault.sNftOwner(tokenId);
        if (owner === ethers.ZeroAddress) continue; // Not actually staked

        const pending = await vault.getPendingReward(tokenId);
        const rewardDebt = await vault.sRewardDebt(tokenId);

        console.log(`Token ID ${tokenId}:`);
        console.log(`  Owner: ${info.user}`);
        console.log(`  Tier: ${info.tier}`);
        console.log(`  Pending: ${ethers.formatUnits(pending, 6)} USDC`);
        console.log(`  Reward Debt: ${ethers.formatUnits(rewardDebt, 18)}`);
        console.log(`  Difference: ${ethers.formatUnits(accRewardPerWeight - rewardDebt, 18)}`);

        if (rewardDebt === 0n) {
            console.log(`  ⚠️  CRITICAL: Reward debt is ZERO! This NFT will drain the vault!`);
        }
        console.log('');
    }
}

checkAllStakedNFTs().catch(console.error);
