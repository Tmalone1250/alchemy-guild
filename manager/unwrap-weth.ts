import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

const WETH_ABI = [
    "function withdraw(uint256) external",
    "function balanceOf(address) view returns (uint256)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY!, provider);
    const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, wallet);

    // Get balances
    const ethBalance = await provider.getBalance(wallet.address);
    const wethBalance = await weth.balanceOf(wallet.address);

    console.log("\n💧 Unwrap WETH → Sepolia ETH\n");
    console.log(`Current ETH:  ${ethers.formatEther(ethBalance)}`);
    console.log(`Current WETH: ${ethers.formatEther(wethBalance)}\n`);

    if (wethBalance === 0n) {
        console.log("❌ ERROR: No WETH to unwrap!");
        return;
    }

    // Default: unwrap all WETH (you can change this)
    const amountToUnwrap = wethBalance;

    console.log(`Unwrapping ${ethers.formatEther(amountToUnwrap)} WETH → ETH...`);
    const tx = await weth.withdraw(amountToUnwrap);
    console.log(`Tx: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Unwrapped!\n");

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
