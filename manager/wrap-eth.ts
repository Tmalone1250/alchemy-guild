import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

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

    // Default: wrap 1 ETH (you can change this)
    const amountToWrap = ethers.parseEther("1.0");

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
