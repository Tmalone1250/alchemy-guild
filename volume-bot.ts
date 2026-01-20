import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// --- Configuration ---
const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const VAULT_ADDRESS = "0xDC684AD1406BdcEd18c2224d75a53c6B5FAea773";  // YieldVault (was pointing to Alchemist!)
const SWAP_ROUTER_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Token1 (Lexicographically larger than USDC)
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Token0

// --- Constants ---
const MIN_SQRT_RATIO = 4295128739n + 1n;
const MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n - 1n;

// --- ABIs ---
const VAULT_ABI = ["function rebalance() external"];
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function deposit() external payable",
    "function transfer(address to, uint256 amount) external returns (bool)",
];
// IV3SwapRouter interface (No deadline)
const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
];

async function main() {
    if (!PRIVATE_KEY || !RPC_URL) throw new Error("Missing env vars");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`\n🤖 Bot Active: ${wallet.address}`);

    // Fix for "in-flight limit reached":
    // Check pending nonce and explicitly set it if needed, or just warn the user.
    const nonce = await provider.getTransactionCount(wallet.address, "latest");
    console.log(`Current Nonce: ${nonce}`);

    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);
    const router = new ethers.Contract(SWAP_ROUTER_ADDRESS, ROUTER_ABI, wallet);
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

    // --- Initial Checks ---
    let ethBalance = await provider.getBalance(wallet.address);
    let wethBalance = await weth.balanceOf(wallet.address);

    console.log(`\n--- Initial Balances ---`);
    console.log(`ETH:  ${ethers.formatEther(ethBalance)}`);
    console.log(`WETH: ${ethers.formatEther(wethBalance)}`);

    // 1. Wrap ETH if needed
    if (wethBalance < ethers.parseEther("0.01") && ethBalance > ethers.parseEther("0.06")) {
        try {
            console.log("\n⛽ Low WETH. Wrapping 0.05 ETH for fuel...");
            const tx = await weth.deposit({ value: ethers.parseEther("0.05") });
            console.log(`Tx sent: ${tx.hash}`);
            await tx.wait();
            console.log("✅ Wrapped 0.05 ETH");
            wethBalance = await weth.balanceOf(wallet.address);
        } catch (e) {
            console.error("⚠️ Failed to wrap ETH:", e);
        }
    }

    // 2. Approvals (One off execution)
    const wethAllowance = await weth.allowance(wallet.address, SWAP_ROUTER_ADDRESS);
    if (wethAllowance < ethers.parseEther("1000")) {
        try {
            console.log("⚠️ Approving Router for WETH...");
            await (await weth.approve(SWAP_ROUTER_ADDRESS, ethers.MaxUint256)).wait();
            console.log("✅ Approved Router");
        } catch (e) {
            console.error("❌ Approval Failed:", e);
        }
    }

    const usdcAllowance = await usdc.allowance(wallet.address, SWAP_ROUTER_ADDRESS);
    if (usdcAllowance < 1000000n) {
        try {
            console.log("⚠️ Approving Router for USDC...");
            await (await usdc.approve(SWAP_ROUTER_ADDRESS, ethers.MaxUint256)).wait();
            console.log("✅ Approved Router for USDC");
        } catch (e) {
            console.error("❌ USDC Approval Failed:", e);
        }
    }

    // --- THE LOOP ---
    console.log("\n--- 🏁 Starting Loop ---");
    let cycle = 1;

    while (true) {
        try {
            console.log(`\n--- ⚗️ Cycle #${cycle} ---`);

            // Check balances
            wethBalance = await weth.balanceOf(wallet.address);
            if (wethBalance < ethers.parseEther("0.001")) {
                console.warn("⚠️ WETH critically low. Skipping.");
                // Should wrap logic here but keeping it simple for now
            }

            // STEP A: Swap WETH -> USDC
            // WETH (Token1) -> USDC (Token0). Price (Token1/Token0) goes UP.
            // Limit must be > current. Use MAX.
            const amountIn = ethers.parseEther("0.001");
            console.log(`Creating Volatility: 0.001 WETH -> USDC`);

            const swapParams = {
                tokenIn: WETH_ADDRESS,
                tokenOut: USDC_ADDRESS,
                fee: 3000,
                recipient: wallet.address,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: MAX_SQRT_RATIO, // Correct Limit for T1 -> T0
            };

            const txSwap = await router.exactInputSingle(swapParams, { gasLimit: 500000 });
            process.stdout.write(`Swap Tx: ${txSwap.hash} ... `);
            await txSwap.wait();
            console.log("✅ Confirmed");
            console.log("⏳ Waiting 5s for RPC propagation...");
            await new Promise(r => setTimeout(r, 5000));

            // STEP B: Swap Back (Neutralize)
            console.log("⏳ Waiting 10s for RPC propagation...");
            await new Promise(r => setTimeout(r, 10000));
            const usdcBal = await usdc.balanceOf(wallet.address);

            if (usdcBal > 100n) {
                console.log(`Neutralizing: ${ethers.formatUnits(usdcBal, 6)} USDC -> WETH`);
                // USDC (Token0) -> WETH (Token1). Price (Token1/Token0) goes DOWN.
                // Limit must be < current. Use MIN.
                const swapBackParams = {
                    tokenIn: USDC_ADDRESS,
                    tokenOut: WETH_ADDRESS,
                    fee: 3000,
                    recipient: wallet.address,
                    amountIn: usdcBal,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: MIN_SQRT_RATIO, // Correct Limit for T0 -> T1
                };
                const txBack = await router.exactInputSingle(swapBackParams, { gasLimit: 500000 });
                process.stdout.write(`Back Tx: ${txBack.hash} ... `);
                await txBack.wait();
                console.log("✅ Confirmed");
            }

            // STEP C: Rebalance (The Ritual)
            if (cycle % 5 === 0) {
                console.log(`🔥 TIME FOR THE RITUAL (Rebalance)`);
                try {
                    // Note: Vault was manually seeded with 0.02 WETH + 10 USDC
                    // Rebalance maintains liquidity by minting new positions

                    const txRebalance = await vault.rebalance({ gasLimit: 2000000 }); // Bump gas
                    process.stdout.write(`Ritual Tx: ${txRebalance.hash} ...`);
                    await txRebalance.wait();
                    console.log("✅ COMPLETE");
                    console.log("⏳ Waiting 5s for RPC propagation...");
                    await new Promise(r => setTimeout(r, 5000));
                } catch (rebalanceError) {
                    console.error("\n❌ Ritual Failed (Vault locked or OOG):", rebalanceError);
                }
            }

            cycle++;
            process.stdout.write("Sleeping 30s...");
            await new Promise(r => setTimeout(r, 30000));
            console.log("\n");

        } catch (err: any) {
            console.error("\n❌ Cycle Error:", err.message || err);
            // If "delegated limits" error, wait longer
            if (err?.error?.message?.includes("delegated")) {
                console.log("Wait for pending txs...");
                await new Promise(r => setTimeout(r, 30000));
            } else {
                await new Promise(r => setTimeout(r, 10000));
            }
        }
    }
}

main().catch(console.error);