import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Sepolia Addresses
const SWAP_ROUTER_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const router = new ethers.Contract(SWAP_ROUTER_ADDRESS, ROUTER_ABI, wallet);

    console.log(`Wallet: ${wallet.address}`);
    const amountIn = ethers.parseEther("0.001");
    // const amountIn = 1000n; // Try tiny amount? No, 0.001 ETH is fine.

    const params = {
        tokenIn: WETH_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: 3000,
        recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 600,
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0n // Use BigInt explicit
    };

    console.log("Attempting manual swap with gasLimit: 500,000...");

    try {
        // Bypass estimateGas by providing gasLimit
        // Note: exactInputSingle is payable, but we send value: 0 for WETH swap
        const tx = await router.exactInputSingle(params, { gasLimit: 500000 });
        console.log(`Tx sent: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log(`✅ Swap Confirmed! Gas Used: ${receipt.gasUsed.toString()}`);
    } catch (e: any) {
        console.error("❌ Swap Failed:", e);
        if (e.transaction) {
            console.error("Tx Data:", e.transaction.data);
        }
        if (e.receipt) {
            console.log("Revert Reason:", e.receipt);
        }
    }
}

main().catch(console.error);
