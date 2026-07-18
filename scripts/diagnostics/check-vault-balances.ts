import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;
const WETH_ADDRESS = CONTRACTS.WETH.address;
const USDC_ADDRESS = CONTRACTS.USDC.address;

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

    console.log(`\n🔍 Checking Balances for YieldVault: ${VAULT_ADDRESS}`);

    try {
        const wethBal = await weth.balanceOf(VAULT_ADDRESS);
        const usdcBal = await usdc.balanceOf(VAULT_ADDRESS);

        console.log(`\n💰 Balances:`);
        console.log(`   WETH: ${ethers.formatUnits(wethBal, 18)}`);
        console.log(`   USDC: ${ethers.formatUnits(usdcBal, 6)}`);

        if (wethBal == 0n || usdcBal == 0n) {
            console.log("\n⚠️  WARNING: One or both balances are ZERO.");
            console.log("   For an 'In-Range' Uniswap V3 position, you MUST provide BOTH assets.");
            console.log("   If you only seed one, the calculated liquidity will be 0 and the transaction will REVERT.");
        } else {
            console.log("\n✅ Balances look good for minting (assuming sufficient value).");
        }

    } catch (error) {
        console.error("❌ Check Failed:", error);
    }
}

main().catch(console.error);
