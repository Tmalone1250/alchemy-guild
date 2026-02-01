import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const SWAP_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

const WETH_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address) view returns (uint256)",
];

const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
];

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY!, provider);
    const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    const router = new ethers.Contract(SWAP_ROUTER, ROUTER_ABI, wallet);

    console.log("\n💱 Swap WETH → USDC\n");

    const wethBalance = await weth.balanceOf(wallet.address);
    const usdcBalance = await usdc.balanceOf(wallet.address);

    console.log(`Current WETH: ${ethers.formatEther(wethBalance)}`);
    console.log(`Current USDC: ${ethers.formatUnits(usdcBalance, 6)}\n`);

    // Default: swap 0.1 WETH (you can change this)
    const amountToSwap = ethers.parseEther("0.1");

    if (wethBalance < amountToSwap) {
        console.log("❌ ERROR: Insufficient WETH balance!");
        console.log(`   Need: ${ethers.formatEther(amountToSwap)} WETH`);
        console.log(`   Have: ${ethers.formatEther(wethBalance)} WETH`);
        console.log("\n💡 Tip: Run 'npx tsx wrap-eth.ts' to get more WETH");
        return;
    }

    // Step 1: Approve
    console.log(`1️⃣ Approving ${ethers.formatEther(amountToSwap)} WETH...`);
    const approveTx = await weth.approve(SWAP_ROUTER, amountToSwap);
    await approveTx.wait();
    console.log("   ✅ Approved\n");

    // Step 2: Swap
    console.log(`2️⃣ Swapping ${ethers.formatEther(amountToSwap)} WETH for USDC...`);
    const swapParams = {
        tokenIn: WETH_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: 3000,
        recipient: wallet.address,
        amountIn: amountToSwap,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    };

    try {
        const swapTx = await router.exactInputSingle(swapParams, { gasLimit: 300000 });
        console.log(`   Tx: ${swapTx.hash}`);
        await swapTx.wait();
        console.log("   ✅ Swapped!\n");

        // Show new balances
        const newWeth = await weth.balanceOf(wallet.address);
        const newUsdc = await usdc.balanceOf(wallet.address);

        console.log("📊 New Balances:");
        console.log(`   WETH: ${ethers.formatEther(newWeth)}`);
        console.log(`   USDC: ${ethers.formatUnits(newUsdc, 6)}`);
    } catch (error: any) {
        console.log("\n❌ Swap failed!");
        console.log("   This could be due to:");
        console.log("   - Low liquidity in the Uniswap pool");
        console.log("   - Slippage too high");
        console.log("   - Wrong pool fee tier");
        console.log(`\n   Error: ${error.message || error}`);
        throw error;
    }
}

main().catch((error) => {
    console.error("\n❌ Error:", error.shortMessage || error.message || error);
    process.exit(1);
});
