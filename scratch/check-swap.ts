import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const SWAP_ROUTER_ADDRESS = "0x101F443B4d1b059569D643917553c771E1b9663E";

const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

const WETH_ADDRESS = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const GUILD_ADDRESS = "0xe2026C28F0F1DaFAbdd10823c54a411590b4f190";
const USDT_ADDRESS = "0xD7635043c67Ce3E5aA3df322E047C07E56687de7";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const router = new ethers.Contract(SWAP_ROUTER_ADDRESS, ROUTER_ABI, provider);

    const trySwap = async (tokenIn: string, tokenOut: string, fee: number, amount: string) => {
        const swapParams = {
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: ethers.ZeroAddress,
            amountIn: amount,
            amountOutMinimum: 0n,
            sqrtPriceLimitX96: 0n
        };
        try {
            const out = await router.exactInputSingle.staticCall(swapParams);
            console.log(`Success! ${amount} in -> ${out} out`);
        } catch (e: any) {
            console.log(`Failed! tokenIn: ${tokenIn}, tokenOut: ${tokenOut}, fee: ${fee}`);
            console.log(e.message);
        }
    }

    await trySwap(WETH_ADDRESS, USDC_ADDRESS, 3000, "1");
    await trySwap(GUILD_ADDRESS, WETH_ADDRESS, 10000, "1");
    await trySwap(USDT_ADDRESS, USDC_ADDRESS, 500, "1");
}

main().catch(console.error);
