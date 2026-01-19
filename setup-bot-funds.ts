import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const SWAP_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

const WETH_ABI = [
    "function deposit() external payable",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address) view returns (uint256)",
];

const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
];

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    const router = new ethers.Contract(SWAP_ROUTER, ROUTER_ABI, wallet);

    console.log("\n💰 ETH → WETH → USDC Conversion\n");

    const ethBalance = await provider.getBalance(wallet.address);
    console.log(`Current ETH: ${ethers.formatEther(ethBalance)}\n`);

    // Strategy: 
    // - Keep 1 ETH for gas fees
    // - Wrap 2 ETH to WETH (keep for bot operations)
    // - Swap 1 ETH worth of WETH to USDC (for vault)

    const wrapAmount = ethers.parseEther("2.0");   // Wrap 2 ETH
    const swapAmount = ethers.parseEther("1.0");   // Swap 1 ETH worth for USDC

    console.log("📋 Conversion Plan:");
    console.log(`   Wrap:  2 ETH → WETH (keep for bot swaps)`);
    console.log(`   Swap:  1 WETH → USDC (for vault operations)`);
    console.log(`   Keep:  ~1.4 ETH (for gas fees)\n`);

    // Step 1: Wrap ETH to WETH
    console.log("1️⃣ Wrapping 2 ETH to WETH...");
    const wrapTx = await weth.deposit({ value: wrapAmount });
    console.log(`   Tx: ${wrapTx.hash}`);
    await wrapTx.wait();
    console.log("   ✅ Wrapped\n");

    // Step 2: Approve router to spend WETH
    console.log("2️⃣ Approving WETH for swap...");
    const approveTx = await weth.approve(SWAP_ROUTER, swapAmount);
    await approveTx.wait();
    console.log("   ✅ Approved\n");

    // Step 3: Swap WETH → USDC
    console.log("3️⃣ Swapping 1 WETH for USDC...");
    const swapParams = {
        tokenIn: WETH_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: 3000,
        recipient: wallet.address,
        amountIn: swapAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    };

    const swapTx = await router.exactInputSingle(swapParams, { gasLimit: 300000 });
    console.log(`   Tx: ${swapTx.hash}`);
    await swapTx.wait();
    console.log("   ✅ Swapped\n");

    // Step 4: Show final balances
    const finalEth = await provider.getBalance(wallet.address);
    const finalWeth = await weth.balanceOf(wallet.address);
    const finalUsdc = await usdc.balanceOf(wallet.address);

    console.log("📊 Final Balances:");
    console.log(`   ETH:  ${ethers.formatEther(finalEth)} (for gas)`);
    console.log(`   WETH: ${ethers.formatEther(finalWeth)} (for bot swaps)`);
    console.log(`   USDC: ${ethers.formatUnits(finalUsdc, 6)} (for vault)\n`);

    console.log("✅ Conversion complete!");
    console.log("🚀 You're now ready to:");
    console.log("   1. Seed the vault: npx tsx manual-seed.ts");
    console.log("   2. Run the bot:   npx tsx volume-bot.ts");
}

main().catch((error) => {
    console.error("\n❌ Error:", error.message || error);
    process.exit(1);
});
