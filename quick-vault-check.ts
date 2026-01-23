import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';
const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

async function quickCheck() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);

    console.log('\n🔍 Quick Vault Check\n');

    // Get vault USDC balance
    const usdcBalance = await provider.call({
        to: USDC_ADDRESS,
        data: '0x70a08231000000000000000000000000DC684AD1406BdcEd18c2224d75a53c6B5FAea773' // balanceOf(vault)
    });

    const balance = BigInt(usdcBalance);
    console.log(`Vault USDC Balance: ${(Number(balance) / 1e6).toFixed(2)} USDC`);

    // Check a few token IDs for pending rewards
    const vaultAbi = ["function getPendingReward(uint256) view returns (uint256)"];
    const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, provider);

    console.log('\nChecking Token IDs 0-9:');
    let total = 0n;
    for (let i = 0; i < 10; i++) {
        try {
            const pending = await vault.getPendingReward(i);
            if (pending > 0n) {
                const usdcAmount = (Number(pending) / 1e6).toFixed(2);
                console.log(`  Token ${i}: ${usdcAmount} USDC`);
                total += pending;
            }
        } catch (e) {
            // Token doesn't exist or not staked
        }
    }

    console.log(`\nTotal from tokens 0-9: ${(Number(total) / 1e6).toFixed(2)} USDC`);
    console.log(`Vault has: ${(Number(balance) / 1e6).toFixed(2)} USDC`);

    if (total > balance) {
        console.log(`\n⚠️  PROBLEM: Pending > Balance by ${((Number(total - balance)) / 1e6).toFixed(2)} USDC\n`);
    }
}

quickCheck().catch(console.error);
