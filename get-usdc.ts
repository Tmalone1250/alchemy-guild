import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || process.env.VITE_INFURA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const PRIVATE_KEY = process.env.BOT_PRIVATE_KEY || process.env.PRIVATE_KEY;
const SWAP_ROUTER = "0x101F443B4d1b059569D643917553c771E1b9663E"; // Arbitrum Sepolia SwapRouter02
const WETH_ADDRESS = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73"; // Arbitrum Sepolia WETH
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"; // Arbitrum Sepolia USDC

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address) view returns (uint256)",
];

const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    const router = new ethers.Contract(SWAP_ROUTER, ROUTER_ABI, wallet);

    console.log("\n💱 Swapping 0.1 WETH → USDC\n");

    const amountIn = ethers.parseEther("0.1"); // Swap 0.1 WETH for USDC

    // Check balance
    const wethBalance = await weth.balanceOf(wallet.address);
    if (wethBalance < amountIn) {
        console.log("❌ Not enough WETH!");
        console.log(`   Need: 0.1 WETH, Have: ${ethers.formatEther(wethBalance)}`);
        return;
    }

    // Approve router
    console.log("1️⃣ Approving WETH...");
    const approveTx = await weth.approve(SWAP_ROUTER, amountIn);
    await approveTx.wait();
    console.log("   ✅ Approved\n");

    // Swap
    console.log("2️⃣ Swapping WETH for USDC...");
    const swapParams = {
        tokenIn: WETH_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: 3000,
        recipient: wallet.address,
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    };

    const swapTx = await router.exactInputSingle(swapParams, { gasLimit: 300000 });
    console.log(`   Tx: ${swapTx.hash}`);
    const receipt = await swapTx.wait();
    console.log("   ✅ Swap complete!\n");

    // Check new balances
    const usdcBalance = await usdc.balanceOf(wallet.address);
    console.log(`3️⃣ New USDC Balance: ${ethers.formatUnits(usdcBalance, 6)}`);
    console.log("\n✅ Now you can run `npx tsx manual-seed.ts` to seed the vault!");
}

main().catch((error) => {
    console.error("\n❌ Error:", error.message || error);
    process.exit(1);
});
