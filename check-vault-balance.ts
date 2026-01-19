import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0xEB118d8E3dB55fA1a2764A8A7144905B26680c68";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

    const vaultWeth = await weth.balanceOf(VAULT_ADDRESS);
    const vaultUsdc = await usdc.balanceOf(VAULT_ADDRESS);

    console.log("\n💰 Vault Balance Check");
    console.log(`Vault: ${VAULT_ADDRESS}\n`);
    console.log(`WETH: ${ethers.formatEther(vaultWeth)} (${vaultWeth.toString()} wei)`);
    console.log(`USDC: ${ethers.formatUnits(vaultUsdc, 6)} (${vaultUsdc.toString()} units)\n`);

    if (vaultWeth === 0n && vaultUsdc === 0n) {
        console.log("❌ VAULT IS EMPTY!");
        console.log("   This is why rebalance() fails - it can't mint a position with 0 liquidity\n");
        console.log("📝 Solution: Seed the vault using manual-seed.ts");
    } else if (vaultWeth < ethers.parseEther("0.01") || vaultUsdc < 5000000n) {
        console.log("⚠️  VAULT HAS LOW LIQUIDITY");
        console.log("   Rebalance might work but with minimal position\n");
    } else {
        console.log("✅ VAULT HAS SUFFICIENT LIQUIDITY");
        console.log("   Rebalance should work!\n");
    }
}

main().catch(console.error);
