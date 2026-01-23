import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const YIELD_VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';
const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

async function simpleCheck() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);

    const vaultAbi = [
        "function getPendingReward(uint256) view returns (uint256)",
        "function sNftOwner(uint256) view returns (address)",
        "event Staked(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 weight)",
        "event Unstaked(address indexed user, uint256 indexed tokenId, uint256 reward)"
    ];

    const usdcAbi = ["function balanceOf(address) view returns (uint256)"];

    const vault = new ethers.Contract(YIELD_VAULT_ADDRESS, vaultAbi, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);

    let output = '\n=== VAULT STATE CHECK ===\n\n';

    // Get vault balance
    const vaultBalance = await usdc.balanceOf(YIELD_VAULT_ADDRESS);
    output += `Vault USDC Balance: ${ethers.formatUnits(vaultBalance, 6)} USDC\n\n`;

    // Get staked NFTs
    const currentBlock = await provider.getBlockNumber();
    const allStakeEvents = await vault.queryFilter(vault.filters.Staked(), currentBlock - 40000);
    const unstakeEvents = await vault.queryFilter(vault.filters.Unstaked(), currentBlock - 40000);

    const staked = new Map();
    for (const event of allStakeEvents) {
        staked.set(event.args[1].toString(), event.args[0]);
    }
    for (const event of unstakeEvents) {
        staked.delete(event.args[1].toString());
    }

    output += `Currently Staked NFTs:\n`;
    let totalPending = 0n;

    for (const [tokenId, user] of staked) {
        const owner = await vault.sNftOwner(tokenId);
        if (owner === ethers.ZeroAddress) continue;

        const pending = await vault.getPendingReward(tokenId);
        totalPending += pending;

        output += `  Token ${tokenId}: ${ethers.formatUnits(pending, 6)} USDC (Owner: ${user.slice(0, 8)}...)\n`;
    }

    output += `\nTotal Pending: ${ethers.formatUnits(totalPending, 6)} USDC\n`;
    output += `Vault Balance: ${ethers.formatUnits(vaultBalance, 6)} USDC\n`;

    if (totalPending > vaultBalance) {
        const shortfall = totalPending - vaultBalance;
        output += `\n⚠️  PROBLEM: Pending rewards exceed balance!\n`;
        output += `   Shortfall: ${ethers.formatUnits(shortfall, 6)} USDC\n`;
    } else {
        output += `\n✅ Vault has enough USDC to cover all pending rewards\n`;
    }

    console.log(output);
    fs.writeFileSync('vault-check.txt', output, 'utf8');
}

simpleCheck().catch(console.error);
