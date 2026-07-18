import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// ============================================================================
// CONFIGURATION & HARDCODED ENDPOINTS (Arbitrum Sepolia - chainId: 421614)
// ============================================================================

// Hardcoded Arbitrum Sepolia Endpoint
const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || process.env.VITE_INFURA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";

// Bot Wallet Private Key (Ensure .env contains BOT_PRIVATE_KEY or PRIVATE_KEY)
const PRIVATE_KEY = process.env.BOT_PRIVATE_KEY || process.env.PRIVATE_KEY || "";

// Verified Arbitrum Sepolia Contract Addresses
const WETH_ADDRESS = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73"; // Arbitrum Sepolia WETH
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"; // Arbitrum Sepolia USDC
const SWAP_ROUTER_02 = "0x101F443B4d1b059569D643917553c771E1b9663E"; // Uniswap V3 SwapRouter02 on Arbitrum Sepolia

// Swap Amount: 0.05 ETH at a time
const SWAP_AMOUNT_ETH = "0.05";
const POOL_FEE = 3000; // 0.3% default pool fee tier

// ============================================================================
// MINIMAL ABIs
// ============================================================================
const SWAP_ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

const ERC20_ABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)"
];

// ============================================================================
// MAIN SWAP EXECUTION
// ============================================================================
async function main() {
    console.log("🌐 Connecting to Arbitrum Sepolia...");
    console.log(`Endpoint: ${RPC_URL}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Verify Network
    const network = await provider.getNetwork();
    console.log(`⛓️  Connected to Chain ID: ${network.chainId} (${network.name})`);
    if (network.chainId !== 421614n) {
        throw new Error(`Expected chainId 421614 (Arbitrum Sepolia), got ${network.chainId}`);
    }

    if (!PRIVATE_KEY) {
        throw new Error("❌ PRIVATE_KEY or BOT_PRIVATE_KEY missing in .env environment!");
    }

    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`🤖 Bot Wallet Address: ${wallet.address}`);

    // Check ETH & USDC Balances Before Swap
    const ethBalanceBefore = await provider.getBalance(wallet.address);
    console.log(`\n--- Balances Before Swap ---`);
    console.log(`ETH Balance:  ${ethers.formatEther(ethBalanceBefore)} ETH`);

    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    const usdcDecimals = await usdcContract.decimals().catch(() => 6n);
    const usdcBalanceBefore = await usdcContract.balanceOf(wallet.address);
    console.log(`USDC Balance: ${ethers.formatUnits(usdcBalanceBefore, usdcDecimals)} USDC`);

    const amountIn = ethers.parseEther(SWAP_AMOUNT_ETH);
    if (ethBalanceBefore < amountIn) {
        throw new Error(`❌ Insufficient ETH balance! Have ${ethers.formatEther(ethBalanceBefore)} ETH, need at least ${SWAP_AMOUNT_ETH} ETH + gas.`);
    }

    // Initialize SwapRouter02
    const swapRouter = new ethers.Contract(SWAP_ROUTER_02, SWAP_ROUTER_ABI, wallet);

    console.log(`\n--- 🚀 Initiating Swap: ${SWAP_AMOUNT_ETH} ETH -> USDC ---`);
    console.log(`Router: ${SWAP_ROUTER_02}`);
    console.log(`Pool Fee Tier: ${POOL_FEE}`);

    // ExactInputSingleParams struct for SwapRouter02
    const params = {
        tokenIn: WETH_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: POOL_FEE,
        recipient: wallet.address,
        amountIn: amountIn,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n
    };

    // Execute exactInputSingle sending 0.5 ETH in msg.value
    // SwapRouter02 automatically wraps msg.value ETH to WETH when tokenIn is WETH9
    const tx = await swapRouter.exactInputSingle(params, {
        value: amountIn,
        gasLimit: 350000n
    });

    console.log(`📡 Broadcasted Swap Tx Hash: ${tx.hash}`);
    console.log(`⏳ Waiting for block confirmation...`);

    const receipt = await tx.wait();
    console.log(`✅ Swap Confirmed in block #${receipt.blockNumber} (Gas Used: ${receipt.gasUsed.toString()})`);

    // Check Balances After Swap
    const ethBalanceAfter = await provider.getBalance(wallet.address);
    const usdcBalanceAfter = await usdcContract.balanceOf(wallet.address);

    console.log(`\n--- Balances After Swap ---`);
    console.log(`ETH Balance:  ${ethers.formatEther(ethBalanceAfter)} ETH (${ethers.formatEther(ethBalanceAfter - ethBalanceBefore)} ETH change including gas)`);
    console.log(`USDC Balance: ${ethers.formatUnits(usdcBalanceAfter, usdcDecimals)} USDC (+${ethers.formatUnits(usdcBalanceAfter - usdcBalanceBefore, usdcDecimals)} USDC received)`);
}

main().catch((err) => {
    console.error("\n❌ Swap Script Error:", err);
    process.exit(1);
});