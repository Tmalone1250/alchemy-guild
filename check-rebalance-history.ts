import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';

async function checkRebalanceHistory() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);

    const vaultAbi = [
        "event Rebalanced(uint256 indexed positionId, uint256 wethCollected, uint256 usdcDistributed, uint256 treasuryTax)"
    ];

    const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, provider);

    console.log('\n📊 Rebalance Event History:\n');

    const currentBlock = await provider.getBlockNumber();
    const events = await vault.queryFilter(
        vault.filters.Rebalanced(),
        currentBlock - 40000,
        currentBlock
    );

    console.log(`Found ${events.length} rebalance events\n`);

    let totalUsdcDistributed = 0n;
    let totalTax = 0n;

    for (const event of events) {
        const positionId = event.args[0];
        const wethCollected = event.args[1];
        const usdcDistributed = event.args[2];
        const tax = event.args[3];

        totalUsdcDistributed += usdcDistributed;
        totalTax += tax;

        console.log(`Block ${event.blockNumber}:`);
        console.log(`  Position ID: ${positionId}`);
        console.log(`  WETH Collected: ${ethers.formatEther(wethCollected)} WETH`);
        console.log(`  USDC Distributed: ${ethers.formatUnits(usdcDistributed, 6)} USDC`);
        console.log(`  Treasury Tax: ${ethers.formatUnits(tax, 6)} USDC`);
        console.log(`  Total Fee (dist + tax): ${ethers.formatUnits(usdcDistributed + tax, 6)} USDC`);
        console.log('');
    }

    console.log(`\n📈 Summary:`);
    console.log(`Total USDC Distributed to Stakers: ${ethers.formatUnits(totalUsdcDistributed, 6)} USDC`);
    console.log(`Total Tax to Treasury: ${ethers.formatUnits(totalTax, 6)} USDC`);
    console.log(`Total Fees Collected: ${ethers.formatUnits(totalUsdcDistributed + totalTax, 6)} USDC`);
}

checkRebalanceHistory().catch(console.error);
