import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const TX_HASH = '0xd229b2267fb7138c1c71e2d30bd8c397a1503055842cd44331266b7cf29c600c';

async function analyzeTransaction() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);

    console.log('\n🔍 Analyzing Transaction:', TX_HASH);
    console.log('='.repeat(70), '\n');

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    if (!receipt) {
        console.log('Transaction not found!');
        return;
    }

    console.log(`Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
    console.log(`Block: ${receipt.blockNumber}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`\nLogs (Events): ${receipt.logs.length} events\n`);

    // Decode USDC transfers
    const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
    const VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';

    const transferTopic = ethers.id('Transfer(address,address,uint256)');

    let totalOut = 0n;
    let totalIn = 0n;

    for (const log of receipt.logs) {
        if (log.address.toLowerCase() === USDC_ADDRESS.toLowerCase() &&
            log.topics[0] === transferTopic) {

            const from = '0x' + log.topics[1].slice(26);
            const to = '0x' + log.topics[2].slice(26);
            const amount = BigInt(log.data);

            const fromVault = from.toLowerCase() === VAULT_ADDRESS.toLowerCase();
            const toVault = to.toLowerCase() === VAULT_ADDRESS.toLowerCase();

            if (fromVault || toVault) {
                console.log(`${fromVault ? '📤 OUT' : '📥 IN'}: ${ethers.formatUnits(amount, 6)} USDC`);
                console.log(`   From: ${from.slice(0, 10)}...`);
                console.log(`   To: ${to.slice(0, 10)}...`);

                if (fromVault) totalOut += amount;
                if (toVault) totalIn += amount;
            }
        }
    }

    console.log(`\n\n💰 Vault USDC Flow:`);
    console.log(`   Total IN: ${ethers.formatUnits(totalIn, 6)} USDC`);
    console.log(`   Total OUT: ${ethers.formatUnits(totalOut, 6)} USDC`);
    console.log(`   Net Change: ${ethers.formatUnits(totalIn - totalOut, 6)} USDC`);

    // Get the transaction itself to see function call
    const tx = await provider.getTransaction(TX_HASH);
    if (tx) {
        console.log(`\n\n📝 Function Called:`);
        console.log(`   To: ${tx.to}`);
        console.log(`   Data (first 10 bytes): ${tx.data.slice(0, 10)}`);

        // Common function signatures
        const signatures = {
            '0x7d7c2a1c': 'rebalance()',
            '0xa694fc3a': 'stake(uint256,uint8)',
            // Add more as needed
        };

        const sig = tx.data.slice(0, 10);
        console.log(`   Function: ${signatures[sig] || 'Unknown'}`);
    }

    if (totalOut > 100000000n) { // More than 100 USDC
        console.log(`\n\n🚨 CRITICAL BUG DETECTED!`);
        console.log(`   Rebalance transferred ${ethers.formatUnits(totalOut, 6)} USDC out of vault!`);
        console.log(`   This is WAY MORE than normal fees (~$3-5 per rebalance)`);
        console.log(`   The vault is being DRAINED by rebalances!`);
    }
}

analyzeTransaction().catch(console.error);
