import { fileURLToPath } from "url";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || process.env.VITE_INFURA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY || process.env.PRIVATE_KEY;
const WETH_ADDRESS = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73"; // Arbitrum Sepolia WETH address

const WETH_ABI = [
    "function deposit() external payable",
    "function balanceOf(address) view returns (uint256)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY!, provider);
    const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, wallet);

    // Get balances
    const ethBalance = await provider.getBalance(wallet.address);
    const wethBalance = await weth.balanceOf(wallet.address);

    console.log("\n💧 Wrap Sepolia ETH → WETH\n");
    console.log(`Current ETH:  ${ethers.formatEther(ethBalance)}`);
    console.log(`Current WETH: ${ethers.formatEther(wethBalance)}\n`);

    // Default: wrap 0.5 ETH (you can change this)
    const amountToWrap = ethers.parseEther("0.5");

    if (ethBalance < amountToWrap) {
        console.log("❌ ERROR: Insufficient ETH balance!");
        console.log(`   Need: ${ethers.formatEther(amountToWrap)} ETH`);
        console.log(`   Have: ${ethers.formatEther(ethBalance)} ETH`);
        return;
    }

    console.log(`Wrapping ${ethers.formatEther(amountToWrap)} ETH → WETH...`);
    const tx = await weth.deposit({ value: amountToWrap });
    console.log(`Tx: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Wrapped!\n");

    // Show new balances
    const newEth = await provider.getBalance(wallet.address);
    const newWeth = await weth.balanceOf(wallet.address);

    console.log("📊 New Balances:");
    console.log(`   ETH:  ${ethers.formatEther(newEth)}`);
    console.log(`   WETH: ${ethers.formatEther(newWeth)}`);
}

main().catch((error) => {
    console.error("\n❌ Error:", error.message || error);
    process.exit(1);
});
