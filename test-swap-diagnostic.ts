import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const SWAP_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

const WETH_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
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

    console.log("\n🧪 WETH→USDC Swap Diagnostic Test\n");
    console.log("Testing direct swap from bot wallet to isolate issue\n");

    // Get current balances
    const wethBalance = await weth.balanceOf(wallet.address);
    const usdcBalance = await usdc.balanceOf(wallet.address);

    console.log("📊 Initial Balances:");
    console.log(`   WETH: ${ethers.formatEther(wethBalance)}`);
    console.log(`   USDC: ${ethers.formatUnits(usdcBalance, 6)}\n`);

    // Test different amounts
    const amounts = [
        ethers.parseEther("0.001"),   // $3
        ethers.parseEther("0.01"),    // $30
        ethers.parseEther("0.05"),    // $150
    ];

    for (let i = 0; i < amounts.length; i++) {
        const amount = amounts[i];
        console.log(`\n=== Test ${i + 1}: Swapping ${ethers.formatEther(amount)} WETH ===\n`);

        if (wethBalance < amount) {
            console.log(`❌ Insufficient WETH (have ${ethers.formatEther(wethBalance)})`);
            continue;
        }

        try {
            // Check/set approval
            const allowance = await weth.allowance(wallet.address, SWAP_ROUTER);
            console.log(`1️⃣ Current allowance: ${ethers.formatEther(allowance)} WETH`);

            if (allowance < amount) {
                console.log(`   Approving ${ethers.formatEther(amount)} WETH...`);
                const approveTx = await weth.approve(SWAP_ROUTER, amount);
                await approveTx.wait();
                console.log(`   ✅ Approved`);
            }

            // Attempt swap
            console.log(`\n2️⃣ Executing swap...`);
            const swapParams = {
                tokenIn: WETH_ADDRESS,
                tokenOut: USDC_ADDRESS,
                fee: 3000,  // 0.3% pool
                recipient: wallet.address,
                amountIn: amount,
                amountOutMinimum: 0,  // No slippage protection for testing
                sqrtPriceLimitX96: 0,
            };

            const swapTx = await router.exactInputSingle(swapParams, {
                gasLimit: 500000  // High gas limit
            });
            console.log(`   Tx: ${swapTx.hash}`);
            const receipt = await swapTx.wait();

            console.log(`   ✅ SUCCESS!`);
            console.log(`   Gas used: ${receipt?.gasUsed.toString()}`);

            // Show new balances
            const newWeth = await weth.balanceOf(wallet.address);
            const newUsdc = await usdc.balanceOf(wallet.address);
            const usdcReceived = newUsdc - usdcBalance;

            console.log(`\n   Final balances:`);
            console.log(`   WETH: ${ethers.formatEther(newWeth)} (- ${ethers.formatEther(amount)})`);
            console.log(`   USDC: ${ethers.formatUnits(newUsdc, 6)} (+ ${ethers.formatUnits(usdcReceived, 6)})`);

            // Stop after first success
            console.log(`\n✅ Swap works! Issue is likely in rebalance context, not Uniswap itself.`);
            break;

        } catch (error: any) {
            console.log(`\n   ❌ FAILED`);
            console.log(`   Error: ${error.message || error}`);

            if (error.data) {
                console.log(`   Data: ${error.data}`);
            }

            // Try to decode the error
            if (error.message.includes("insufficient")) {
                console.log(`\n   💡 Looks like a liquidity/balance issue`);
            } else if (error.message.includes("EXPIRED")) {
                console.log(`\n   💡 Deadline/timing issue`);
            } else {
                console.log(`\n   💡 Unknown error - check Etherscan for details`);
            }
        }
    }
}

main().catch((error) => {
    console.error("\n❌ Test failed:", error.message || error);
    process.exit(1);
});
