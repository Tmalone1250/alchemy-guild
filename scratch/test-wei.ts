import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const SWAP_ROUTER_ADDRESS = "0x101F443B4d1b059569D643917553c771E1b9663E";
const BOT_PK = process.env.BOT_PRIVATE_KEY!;

const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];
const ERC20_ABI = [
    "function approve(address, uint256) external returns (bool)"
];

const WETH_ADDRESS = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PK, provider);
    const router = new ethers.Contract(SWAP_ROUTER_ADDRESS, ROUTER_ABI, wallet);
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, wallet);

    console.log("Approving router...");
    await (await weth.approve(SWAP_ROUTER_ADDRESS, ethers.MaxUint256)).wait();

    const swapParams = {
        tokenIn: WETH_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: 3000,
        recipient: wallet.address,
        amountIn: "1", // 1 wei
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n
    };
    try {
        console.log("Static calling swap...");
        const out = await router.exactInputSingle.staticCall(swapParams);
        console.log(`Success! 1 wei in -> ${out} out`);
    } catch (e: any) {
        console.log(`Failed!`);
        console.log(e.message);
    }
}

main().catch(console.error);
