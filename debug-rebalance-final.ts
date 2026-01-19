import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const VAULT_ADDRESS = "0xEB118d8E3dB55fA1a2764A8A7144905B26680c68";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const VAULT_ABI = [
    "function rebalance() external",
    "function sLastPositionId() view returns (uint256)",
    "function sTotalWeight() view returns (uint256)",
];

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

    console.log("\n🔍 Debugging Rebalance Failure\n");

    // Check vault state
    const lastPositionId = await vault.sLastPositionId();
    const totalWeight = await vault.sTotalWeight();
    const vaultWeth = await weth.balanceOf(VAULT_ADDRESS);
    const vaultUsdc = await usdc.balanceOf(VAULT_ADDRESS);

    console.log("📊 Vault State:");
    console.log(`   Last Position ID: ${lastPositionId}`);
    console.log(`   Total Weight:     ${totalWeight}`);
    console.log(`   WETH:             ${ethers.formatEther(vaultWeth)}`);
    console.log(`   USDC:             ${ethers.formatUnits(vaultUsdc, 6)}\n`);

    // Try to estimate gas for rebalance
    console.log("⛽ Estimating gas for rebalance...");
    try {
        const vaultWithSigner = vault.connect(wallet);
        const gasEstimate = await vaultWithSigner.rebalance.estimateGas();
        console.log(`   ✅ Estimated gas: ${gasEstimate.toString()}`);
        console.log("   This suggests rebalance should work!\n");
    } catch (error: any) {
        console.log(`   ❌ Gas estimation failed`);
        console.log(`   Error: ${error.message || error}\n`);

        if (error.data) {
            console.log(`   Error data: ${error.data}`);
        }

        // Check for specific errors
        if (error.message.includes("balance")) {
            console.log("\n💡 Diagnosis: Insufficient token balance");
            console.log("   The vault might not have enough WETH/USDC for the operation");
        } else if (error.message.includes("Ownable")) {
            console.log("\n💡 Diagnosis: Ownership issue");
            console.log("   The bot wallet might not own the vault");
        } else if (error.message.includes("ZERO_LIQUIDITY") || lastPositionId === 0n) {
            console.log("\n💡 Diagnosis: First-time rebalance with zero position");
            console.log("   The vault has never had a Uniswap position before");
            console.log("   This is normal - rebalance will CREATE the first position");
        }
    }

    // Check if vault has been used before
    if (lastPositionId === 0n) {
        console.log("ℹ️  This is the FIRST rebalance for this vault");
        console.log("   Rebalance will:");
        console.log("   1. Skip decreaseLiquidity (no prior position)");
        console.log("   2. Use current WETH/USDC to mint first position");
        console.log("   3. Set sLastPositionId to the new NFT ID\n");
    }
}

main().catch(console.error);
