import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const VAULT_ADDRESS = '0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773';

async function checkGlobalState() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL!);

    const vaultAbi = [
        "function sAccRewardPerWeight() view returns (uint256)",
        "function sTotalWeight() view returns (uint256)"
    ];

    const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, provider);

    const accRewardPerWeight = await vault.sAccRewardPerWeight();
    const totalWeight = await vault.sTotalWeight();

    console.log('\n📊 Global Vault State:\n');
    console.log(`sAccRewardPerWeight (raw): ${accRewardPerWeight}`);
    console.log(`sAccRewardPerWeight (divided by 1e18): ${ethers.formatUnits(accRewardPerWeight, 18)}`);
    console.log(`sTotalWeight: ${totalWeight}`);

    // Simulate what pending reward would be for different weights if sRewardDebt = 0
    console.log('\n💰 Simulated Pending Rewards (if sRewardDebt = 0):\n');

    const weights = [100, 135, 175]; // Tier 1, 2, 3
    const SCALE_FACTOR = BigInt(1e18);

    for (let i = 0; i < weights.length; i++) {
        const weight = BigInt(weights[i]);
        const pending = (weight * accRewardPerWeight) / SCALE_FACTOR;
        console.log(`  Tier ${i + 1} (weight ${weights[i]}): ${ethers.formatUnits(pending, 6)} USDC`);
    }
}

checkGlobalState().catch(console.error);
