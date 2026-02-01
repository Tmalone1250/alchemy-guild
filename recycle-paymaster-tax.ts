
import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS, PAYMASTER_ADDRESS } from "./src/config/contracts";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

if (!PRIVATE_KEY) {
    console.error("Missing PRIVATE_KEY in .env");
    process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// ABIs
const PAYMASTER_ABI = [
    "function withdrawERC20(address token, address to, uint256 amount) external",
    "function deposit() public payable",
    "function getDeposit() public view returns (uint256)"
];

const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

const WETH_ABI = [
    ...ERC20_ABI,
    "function withdraw(uint256 wad) external"
];

const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)"
];

const ROUTER_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"; // Uniswap V3 SwapRouter02 (Sepolia)

async function recycle() {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🔄 Starting Paymaster Tax Recycler Cycle...`);
    // console.log(`Pool Address (Verification): ${CONTRACTS.Pool.address}`);
    // console.log(`Paymaster: ${PAYMASTER_ADDRESS}`);
    
    // Contracts
    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, wallet);
    const usdc = new ethers.Contract(CONTRACTS.USDC.address, ERC20_ABI, wallet);
    const weth = new ethers.Contract(CONTRACTS.WETH.address, WETH_ABI, wallet);
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);

    // 1. Check Paymaster USDC Balance
    const usdcBalance = await usdc.balanceOf(PAYMASTER_ADDRESS);
    console.log(`💰 Paymaster USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);

    if (usdcBalance == 0n) {
        console.log("⚠️ Paymaster has 0 USDC.");
    }

    // Check Owner Balance too (in case of previous partial run)
    const ownerUsdcStart = await usdc.balanceOf(wallet.address);
    // console.log(`👤 Owner USDC Balance: ${ethers.formatUnits(ownerUsdcStart, 6)}`);

    if (usdcBalance == 0n && ownerUsdcStart < 100000n) { // Less than 0.1 USDC
         console.log("✅ No significant USDC to recycle anywhere. Waiting for next cycle.");
         return;
    }

    // 2. Withdraw USDC from Paymaster to Owner (only if Paymaster has funds)
    if (usdcBalance > 0n) {
        console.log("🔻 Withdrawing USDC from Paymaster...");
        try {
            const withdrawTx = await paymaster.withdrawERC20(
                CONTRACTS.USDC.address,
                wallet.address,
                usdcBalance
            );
            await withdrawTx.wait();
            console.log("✅ Withdraw confirmed.");
        } catch (e) {
            console.error("❌ Withdraw Failed:", e);
            return;
        }
    }
    
    // Recalculate total USDC to swap (Paymaster withdrawn + existing owner funds)
    const totalUsdcToSwap = await usdc.balanceOf(wallet.address);



    // 3. Swap USDC -> WETH (SKIPPING - Sepolia Liquidity Issue)
    console.log(`⚠️ Skipping Uniswap execution due to testnet liquidity constraints.`);
    console.log(`🔄 Performing Manual Recirculation (OTC: USDC kept, ETH sent)...`);
    
    // 4. Determine ETH amount to seed based on USDC swapped
    // 1 USDC ~ 0.0003 ETH. Let's send equivalent.
    // If totalUsdcToSwap < 1.0 (threshold), DO NOT FUND.
    
    if (totalUsdcToSwap < 1000000n) { // Less than 1.0 USDC
        console.log("❌ Available USDC is too low to justify gas. Skipping cycle.");
        return;
    }
    
    // Calculate ETH amount (Simulated Rate: 1 USDC = 0.0003 ETH)
    // 1e6 (1 USDC) * 3e14 (0.0003 ETH) / 1e6 = 3e14? No.
    // Simple math: (USDC Amount * 0.0003 ether) / 1e6
    const rate = ethers.parseEther("0.0003"); 
    const ethToSeed = (totalUsdcToSwap * rate) / 1000000n;
    
    console.log(`💱 Simulated OTC Rate: ${ethers.formatUnits(totalUsdcToSwap, 6)} USDC => ${ethers.formatEther(ethToSeed)} ETH`); 

    // 5. Deposit ETH to Paymaster
    const ethBalance = await provider.getBalance(wallet.address);
    console.log(`👤 Owner ETH Balance: ${ethers.formatEther(ethBalance)}`);
    
    if (ethBalance < ethToSeed) {
        console.error("❌ Owner has insufficient ETH to seed Paymaster!");
        return;
    }

    if (ethToSeed > 0n) {
        console.log(`⛽ Funding Paymaster with ${ethers.formatEther(ethToSeed)} ETH...`);
        try {
            const depositTx = await paymaster.deposit({ value: ethToSeed });
            await depositTx.wait();
            console.log("✅ Deposit confirmed.");
        } catch (e) {
             console.error("❌ Deposit Failed:", e);
        }
    }
    
    // Final Check
    const newDeposit = await paymaster.getDeposit();
    console.log(`🎉 Cycle Complete! Paymaster Gas Tank: ${ethers.formatEther(newDeposit)} ETH`);
}

async function main() {
    const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
    
    console.log("🤖 Starting Paymaster Recycler Bot (Daemon Mode)");
    console.log("⏰ Schedule: Every 30 minutes");

    // Run immediately on start
    await recycle().catch(console.error);

    // Loop
    setInterval(async () => {
        await recycle().catch(console.error);
    }, INTERVAL_MS);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
