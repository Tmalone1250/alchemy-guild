import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';
const BOT_WALLET = '0xd83B5031506039893BF1C827b0A79aDDee71E1fE';

async function checkClaimHistory() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);

    const vaultAbi = [
        "event YieldClaimed(address indexed user, uint256 indexed tokenId, uint256 reward)",
        "event Unstaked(address indexed user, uint256 indexed tokenId, uint256 reward)"
    ];

    const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, provider);

    console.log('\n💰 Claim & Unstake History\n');
    console.log('='.repeat(70));

    const currentBlock = await provider.getBlockNumber();

    // Get YieldClaimed events
    const claimEvents = await vault.queryFilter(
        vault.filters.YieldClaimed(),
        currentBlock - 40000,
        currentBlock
    );

    // Get Unstaked events (unstaking also pays out rewards)
    const unstakeEvents = await vault.queryFilter(
        vault.filters.Unstaked(),
        currentBlock - 40000,
        currentBlock
    );

    console.log(`\n📊 Found ${claimEvents.length} claim events and ${unstakeEvents.length} unstake events\n`);

    // Track by user
    const userClaims = new Map();

    // Process claims
    for (const event of claimEvents) {
        const user = event.args[0];
        const tokenId = event.args[1];
        const reward = event.args[2];

        if (!userClaims.has(user)) {
            userClaims.set(user, { claims: 0n, unstakes: 0n, total: 0n });
        }
        userClaims.get(user).claims += reward;
        userClaims.get(user).total += reward;

        console.log(`Block ${event.blockNumber}: ${user.slice(0, 10)}... claimed ${ethers.formatUnits(reward, 6)} USDC (Token ${tokenId})`);
    }

    // Process unstakes
    console.log('\n');
    for (const event of unstakeEvents) {
        const user = event.args[0];
        const tokenId = event.args[1];
        const reward = event.args[2];

        if (!userClaims.has(user)) {
            userClaims.set(user, { claims: 0n, unstakes: 0n, total: 0n });
        }
        userClaims.get(user).unstakes += reward;
        userClaims.get(user).total += reward;

        console.log(`Block ${event.blockNumber}: ${user.slice(0, 10)}... unstaked and claimed ${ethers.formatUnits(reward, 6)} USDC (Token ${tokenId})`);
    }

    // Summary by user
    console.log('\n\n📈 Summary by Wallet:\n');
    let grandTotal = 0n;

    for (const [user, amounts] of userClaims) {
        console.log(`\n${user}:`);
        console.log(`  Claims: ${ethers.formatUnits(amounts.claims, 6)} USDC`);
        console.log(`  Unstakes: ${ethers.formatUnits(amounts.unstakes, 6)} USDC`);
        console.log(`  Total: ${ethers.formatUnits(amounts.total, 6)} USDC`);

        if (user.toLowerCase() === BOT_WALLET.toLowerCase()) {
            console.log(`  👆 This is the BOT WALLET!`);
        }

        grandTotal += amounts.total;
    }

    console.log(`\n\n🎯 GRAND TOTAL CLAIMED: ${ethers.formatUnits(grandTotal, 6)} USDC`);
    console.log(`\nThis explains where the USDC went from the vault!\n`);
}

checkClaimHistory().catch(console.error);
