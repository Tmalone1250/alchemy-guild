import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const VAULT_ADDRESS = "0xC2e73bD133a9eB6517EDc342F0B86AAfeE61EAa9";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

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

    const seedWeth = ethers.parseEther("0.05");
    const seedUsdc = 100000000n; // 100 USDC

    if (botWeth < seedWeth) {
        console.log("❌ ERROR: Bot doesn't have enough WETH!");
        console.log(`   Need: 0.05 WETH, Have: ${ethers.formatEther(botWeth)}`);
        return;
    }

    if (botUsdc < seedUsdc) {
        console.log("❌ ERROR: Bot doesn't have enough USDC!");
        console.log(`   Need: 100 USDC, Have: ${ethers.formatUnits(botUsdc, 6)}`);
        return;
    }

    // Transfer WETH
    console.log("💸 Transferring 0.05 WETH to Vault...");
    const tx1 = await weth.transfer(VAULT_ADDRESS, seedWeth);
    console.log(`   Tx: ${tx1.hash}`);
    await tx1.wait();
    console.log("   ✅ Confirmed\n");

    // Transfer USDC
    console.log("💸 Transferring 100 USDC to Vault...");
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
