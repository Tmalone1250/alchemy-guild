import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SWAP_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

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

    console.log("\n💱 Swapping 0.01 WETH → USDC\n");

    const amountIn = ethers.parseEther("0.01"); // Swap 0.01 WETH for USDC

    // Check balance
    const wethBalance = await weth.balanceOf(wallet.address);
    if (wethBalance < amountIn) {
        console.log("❌ Not enough WETH!");
        console.log(`   Need: 0.01 WETH, Have: ${ethers.formatEther(wethBalance)}`);
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
