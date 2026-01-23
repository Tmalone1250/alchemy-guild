import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const YIELD_VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';
const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

async function checkVaultState() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);

    const vaultAbi = [
        "event Staked(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 weight)",
        "event Unstaked(address indexed user, uint256 indexed tokenId, uint256 reward)",
        "event YieldClaimed(address indexed user, uint256 indexed tokenId, uint256 reward)",
        "function getPendingReward(uint256) view returns (uint256)",
        "function sRewardDebt(uint256) view returns (uint256)",
        "function sAccRewardPerWeight() view returns (uint256)",
        "function sNftOwner(uint256) view returns (address)",
        "function sTotalWeight() view returns (uint256)"
    ];

    const usdcAbi = [
        "function balanceOf(address) view returns (uint256)",
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];

    const vault = new ethers.Contract(YIELD_VAULT_ADDRESS, vaultAbi, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);

    console.log('\n🔍 Vault State Diagnostic');
    console.log('='.repeat(70));

    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 10000; // Last ~10k blocks

    // Get current vault USDC balance
    const vaultBalance = await usdc.balanceOf(YIELD_VAULT_ADDRESS);
    console.log(`\n💰 Current Vault USDC Balance: ${ethers.formatUnits(vaultBalance, 6)} USDC\n`);

    // Get global state
    const accRewardPerWeight = await vault.sAccRewardPerWeight();
    const totalWeight = await vault.sTotalWeight();

    console.log(`📊 Global State:`);
    console.log(`   sAccRewardPerWeight: ${ethers.formatUnits(accRewardPerWeight, 18)}`);
    console.log(`   sTotalWeight: ${totalWeight}\n`);

    // Get recent Stake events
    console.log(`📥 Recent Stake Events (last 10k blocks):\n`);
    const stakeEvents = await vault.queryFilter(vault.filters.Staked(), fromBlock, currentBlock);

    for (const event of stakeEvents.slice(-5)) { // Last 5
        console.log(`   Block ${event.blockNumber}: User ${event.args[0].slice(0, 10)}... staked Token ${event.args[1]} (Tier ${event.args[2]})`);
    }

    // Get recent USDC transfers FROM vault
    console.log(`\n💸 Recent USDC Transfers FROM Vault:\n`);
    const transfersOut = await usdc.queryFilter(
        usdc.filters.Transfer(YIELD_VAULT_ADDRESS, null),
        fromBlock,
        currentBlock
    );

    let totalOut = 0n;
    for (const event of transfersOut.slice(-10)) { // Last 10
        const amount = event.args[2];
        totalOut += amount;
        console.log(`   Block ${event.blockNumber}: ${ethers.formatUnits(amount, 6)} USDC to ${event.args[1].slice(0, 10)}...`);
    }
    console.log(`   Total transferred out: ${ethers.formatUnits(totalOut, 6)} USDC`);

    // Get recent USDC transfers TO vault
    console.log(`\n📩 Recent USDC Transfers TO Vault:\n`);
    const transfersIn = await usdc.queryFilter(
        usdc.filters.Transfer(null, YIELD_VAULT_ADDRESS),
        fromBlock,
        currentBlock
    );

    let totalIn = 0n;
    for (const event of transfersIn.slice(-10)) { // Last 10
        const amount = event.args[2];
        totalIn += amount;
        console.log(`   Block ${event.blockNumber}: ${ethers.formatUnits(amount, 6)} USDC from ${event.args[0].slice(0, 10)}...`);
    }
    console.log(`   Total transferred in: ${ethers.formatUnits(totalIn, 6)} USDC`);

    // Calculate net flow
    const netFlow = totalIn - totalOut;
    console.log(`\n📈 Net Flow: ${ethers.formatUnits(netFlow, 6)} USDC`);

    // Get currently staked NFTs
    console.log(`\n🎴 Currently Staked NFTs:\n`);
    const allStakeEvents = await vault.queryFilter(vault.filters.Staked(), currentBlock - 40000, currentBlock);
    const unstakeEvents = await vault.queryFilter(vault.filters.Unstaked(), currentBlock - 40000, currentBlock);

    const staked = new Map();
    for (const event of allStakeEvents) {
        const tokenId = event.args[1].toString();
        staked.set(tokenId, { user: event.args[0], tier: event.args[2] });
    }

    for (const event of unstakeEvents) {
        const tokenId = event.args[1].toString();
        staked.delete(tokenId);
    }

    let totalPending = 0n;
    for (const [tokenId, info] of staked) {
        const owner = await vault.sNftOwner(tokenId);
        if (owner === ethers.ZeroAddress) continue;

        const pending = await vault.getPendingReward(tokenId);
        const rewardDebt = await vault.sRewardDebt(tokenId);
        totalPending += pending;

        console.log(`   Token ${tokenId} (Tier ${info.tier}): Owner ${info.user.slice(0, 10)}..., Pending: ${ethers.formatUnits(pending, 6)} USDC, Debt: ${ethers.formatUnits(rewardDebt, 18)}`);
    }

    console.log(`\n💎 Total Pending Rewards: ${ethers.formatUnits(totalPending, 6)} USDC`);
    console.log(`💰 Available Balance: ${ethers.formatUnits(vaultBalance, 6)} USDC`);

    if (totalPending > vaultBalance) {
        console.log(`⚠️  WARNING: Total pending rewards (${ethers.formatUnits(totalPending, 6)}) exceeds vault balance (${ethers.formatUnits(vaultBalance, 6)})!`);
        console.log(`   Shortfall: ${ethers.formatUnits(totalPending - vaultBalance, 6)} USDC`);
    }
}

checkVaultState().catch(console.error);
