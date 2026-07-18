import { fileURLToPath } from "url";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || process.env.VITE_INFURA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0x2Ed51bD2CD7148197C8aBbF53D171e1c8bb41CdC"; // Arbitrum Sepolia YieldVault
const WETH_ADDRESS = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73"; // Arbitrum Sepolia WETH
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"; // Arbitrum Sepolia USDC

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY!, provider);

    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

    console.log("\n🌱 Manual Vault Seeding Script");
    console.log(`Vault: ${VAULT_ADDRESS}`);
    console.log(`Bot:   ${wallet.address}\n`);

    // Check bot balances
    const botWeth = await weth.balanceOf(wallet.address);
    const botUsdc = await usdc.balanceOf(wallet.address);

    console.log("📊 Bot Balances:");
    console.log(`   WETH: ${ethers.formatEther(botWeth)}`);
    console.log(`   USDC: ${ethers.formatUnits(botUsdc, 6)}\n`);

    // Check vault balances
    const vaultWeth = await weth.balanceOf(VAULT_ADDRESS);
    const vaultUsdc = await usdc.balanceOf(VAULT_ADDRESS);

    console.log("📊 Vault Balances (Before):");
    console.log(`   WETH: ${ethers.formatEther(vaultWeth)}`);
    console.log(`   USDC: ${ethers.formatUnits(vaultUsdc, 6)}\n`);

    const seedWeth = ethers.parseEther("0.5"); // 0.5 WETH
    const seedUsdc = 10000000000n; // 10000 USDC

    if (botWeth < seedWeth) {
        console.log("❌ ERROR: Bot doesn't have enough WETH!");
        console.log(`   Need: 0.5 WETH, Have: ${ethers.formatEther(botWeth)}`);
        return;
    }

    if (botUsdc < seedUsdc) {
        console.log("❌ ERROR: Bot doesn't have enough USDC!");
        console.log(`   Need: 10000 USDC, Have: ${ethers.formatUnits(botUsdc, 6)}`);
        return;
    }

    // Transfer WETH
    console.log("💸 Transferring 0.5 WETH to Vault...");
    const tx1 = await weth.transfer(VAULT_ADDRESS, seedWeth);
    console.log(`   Tx: ${tx1.hash}`);
    await tx1.wait();
    console.log("   ✅ Confirmed\n");

    // Transfer USDC
    console.log("💸 Transferring 10000 USDC to Vault...");
    const tx2 = await usdc.transfer(VAULT_ADDRESS, seedUsdc);
    console.log(`   Tx: ${tx2.hash}`);
    await tx2.wait();
    console.log("   ✅ Confirmed\n");

    // Check vault balances again
    const vaultWethAfter = await weth.balanceOf(VAULT_ADDRESS);
    const vaultUsdcAfter = await usdc.balanceOf(VAULT_ADDRESS);

    console.log("📊 Vault Balances (After):");
    console.log(`   WETH: ${ethers.formatEther(vaultWethAfter)}`);
    console.log(`   USDC: ${ethers.formatUnits(vaultUsdcAfter, 6)}\n`);

    console.log("✅ Vault seeded successfully!");
    console.log("🚀 You can now run the volume bot and rebalance() should work.");
}

main().catch((error) => {
    console.error("\n❌ Error:", error.message || error);
    process.exit(1);
});
