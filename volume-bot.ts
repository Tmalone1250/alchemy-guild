import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { createEthersHandleClient } from "@iexec-nox/handle";

dotenv.config();

// --- Configuration ---
const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || process.env.VITE_INFURA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0x2Ed51bD2CD7148197C8aBbF53D171e1c8bb41CdC";  // YieldVault on Arbitrum Sepolia
const SWAP_ROUTER_ADDRESS = "0x101F443B4d1b059569D643917553c771E1b9663E"; // Uniswap V3 SwapRouter02 on Arbitrum Sepolia
const WETH_ADDRESS = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73"; // WETH on Arbitrum Sepolia
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"; // USDC on Arbitrum Sepolia

// --- Constants ---
const MIN_SQRT_RATIO = 4295128739n + 1n;
const MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n - 1n;

// --- ABIs ---
const VAULT_ABI = [
    "function rebalance(bytes32 encryptedTickLower, bytes proofLower, bytes32 encryptedTickUpper, bytes proofUpper) external",
    "function executeRebalance(bytes32 encryptedTickLower, bytes proofLower, bytes32 encryptedTickUpper, bytes proofUpper) external",
    "function executeRebalanceDirect(int24 tickLower, int24 tickUpper) external",
    "function sPendingRebalance() external view returns (bool)",
    "function sEncryptedTickLower() external view returns (bytes32)",
    "function sEncryptedTickUpper() external view returns (bytes32)",
    "function sLastPositionId() external view returns (uint256)",
    "function POOL() external view returns (address)"
];
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
    if (!BOT_PRIVATE_KEY || !RPC_URL) throw new Error("Missing env vars: BOT_PRIVATE_KEY and VITE_INFURA_RPC_URL required");

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Single bot wallet — owns the vault and executes all operations
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);

    console.log(`\n🤖 Bot Active: ${wallet.address}`);

    const nonce = await provider.getTransactionCount(wallet.address, "latest");
    console.log(`Current Nonce: ${nonce}`);

    // Vault connected to bot wallet (owner) for all calls
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);
    const router = new ethers.Contract(SWAP_ROUTER_ADDRESS, ROUTER_ABI, wallet);
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

    // Initialize Pool contract by fetching address from vault
    const poolAddress = await vault.POOL();
    console.log(`\n🔍 Vault POOL Address: ${poolAddress}`);
    const pool = new ethers.Contract(poolAddress, [
        "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationNext, uint16 observationCardinality, uint8 feeProtocol, bool unlocked)",
        "function tickSpacing() external view returns (int24)",
        "function fee() external view returns (uint24)",
        "function token0() external view returns (address)",
        "function token1() external view returns (address)"
    ], provider);
    try {
        const poolFee = await pool.fee();
        console.log(`🔍 Pool Fee: ${poolFee}`);
        const token0 = await pool.token0();
        const token1 = await pool.token1();
        console.log(`🔍 Pool token0: ${token0}`);
        console.log(`🔍 Pool token1: ${token1}`);
    } catch (e) {
        console.log("Could not fetch pool details from pool contract:", e);
    }

    // --- Initial Checks ---
    let ethBalance = await provider.getBalance(wallet.address);
    let wethBalance = await weth.balanceOf(wallet.address);

    console.log(`\n--- Initial Balances ---`);
    console.log(`ETH:  ${ethers.formatEther(ethBalance)}`);
    console.log(`WETH: ${ethers.formatEther(wethBalance)}`);

    // 1. Wrap ETH if needed
    if (wethBalance < ethers.parseEther("0.05") && ethBalance > ethers.parseEther("0.06")) {
        try {
            console.log("\n⛽ Low WETH. Wrapping 0.15 ETH for fuel...");
            const tx = await weth.deposit({ value: ethers.parseEther("0.15") });
            console.log(`Tx sent: ${tx.hash}`);
            await tx.wait();
            console.log("✅ Wrapped 0.15 ETH");
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

            // Check balances and auto-wrap inside loop if needed
            ethBalance = await provider.getBalance(wallet.address);
            wethBalance = await weth.balanceOf(wallet.address);
            if (wethBalance < ethers.parseEther("0.02") && ethBalance > ethers.parseEther("0.05")) {
                console.log("⛽ Auto-wrapping 0.05 ETH inside loop for fuel...");
                await (await weth.deposit({ value: ethers.parseEther("0.05") })).wait();
                wethBalance = await weth.balanceOf(wallet.address);
            }

            if (wethBalance < ethers.parseEther("0.005")) {
                console.warn("⚠️ WETH and ETH critically low. Skipping cycle.");
                await new Promise(r => setTimeout(r, 10000));
                continue;
            }

            // Query USDC balance before swap
            const usdcBalBefore = await usdc.balanceOf(wallet.address);

            // STEP A: Swap WETH -> USDC
            // WETH (Token1) -> USDC (Token0). Price (Token1/Token0) goes UP.
            // Limit must be > current. Use MAX.
            const amountIn = ethers.parseEther("0.01");
            console.log(`Creating Volatility: 0.01 WETH -> USDC`);

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
            console.log("⏳ Waiting 10s for RPC propagation...");
            await new Promise(r => setTimeout(r, 10000));

            // STEP B: Swap Back (Neutralize only the received amount)
            const usdcBalAfter = await usdc.balanceOf(wallet.address);
            const usdcReceived = usdcBalAfter > usdcBalBefore ? usdcBalAfter - usdcBalBefore : 0n;

            if (usdcReceived > 0n) {
                console.log(`Neutralizing: ${ethers.formatUnits(usdcReceived, 6)} USDC -> WETH`);
                // USDC (Token0) -> WETH (Token1). Price (Token1/Token0) goes DOWN.
                // Limit must be < current. Use MIN.
                const swapBackParams = {
                    tokenIn: USDC_ADDRESS,
                    tokenOut: WETH_ADDRESS,
                    fee: 3000,
                    recipient: wallet.address,
                    amountIn: usdcReceived,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: MIN_SQRT_RATIO, // Correct Limit for T0 -> T1
                };
                const txBack = await router.exactInputSingle(swapBackParams, { gasLimit: 500000 });
                process.stdout.write(`Back Tx: ${txBack.hash} ... `);
                await txBack.wait();
                console.log("✅ Confirmed");
            } else {
                console.log("No USDC received from swap, skipping neutralization.");
            }

            // STEP C: Rebalance (The Ritual)
            if (cycle === 1 || cycle % 5 === 0) {
                console.log(`\n🔥 TIME FOR THE RITUAL (Rebalance)`);
                try {
                    // 1. Get current pool tick and spacing
                    const slot0 = await pool.slot0();
                    const tick = Number(slot0[1]);
                    const tickSpacing = Number(await pool.tickSpacing());
                    
                    // Nearest usable tick calculation
                    let rounded = Math.floor(tick / tickSpacing) * tickSpacing;
                    if (tick < 0 && (tick % tickSpacing !== 0)) {
                        rounded -= tickSpacing;
                    }
                    
                    const tickLower = rounded - Math.floor(500 / tickSpacing) * tickSpacing;
                    const tickUpper = rounded + Math.floor(500 / tickSpacing) * tickSpacing;
                    
                    console.log(`Calculated ticks: lower=${tickLower}, upper=${tickUpper}`);
                    
                    // Calculate expected USDC output and 1% slippage limit for rebalance WETH -> USDC swap
                    const sqrtPriceX96 = BigInt(slot0[0]);
                    const lastPositionId = await vault.sLastPositionId();
                    let expectedUsdc = 0n;
                    let amountOutMin = 0n;
                    
                    const pmAddress = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65"; // Uniswap V3 NonfungiblePositionManager on Arbitrum Sepolia

                    if (lastPositionId > 0n && sqrtPriceX96 > 0n) {
                        const pmAbi = [
                            "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
                        ];
                        const pm = new ethers.Contract(pmAddress, pmAbi, provider); // NonfungiblePositionManager
                        const posInfo = await pm.positions(lastPositionId);
                        const tokensOwed1 = BigInt(posInfo[11]); // WETH fees owed
                        const vaultWeth = await weth.balanceOf(VAULT_ADDRESS);
                        const totalWeth = tokensOwed1 + vaultWeth;
                        const netWeth = totalWeth * 9n / 10n; // 90% staker share
                        
                        if (netWeth > 0n) {
                            expectedUsdc = (netWeth * (2n ** 192n)) / (sqrtPriceX96 * sqrtPriceX96 * (10n ** 12n));
                            amountOutMin = expectedUsdc * 99n / 100n; // 1% slippage
                        }
                    }
                    
                    console.log(`Expected WETH to swap: ${ethers.formatEther(lastPositionId > 0n ? (await weth.balanceOf(VAULT_ADDRESS)) : 0n)} WETH`);
                    console.log(`Expected swap output: ${ethers.formatUnits(expectedUsdc, 6)} USDC`);
                    console.log(`Slippage amountOutMinimum: ${ethers.formatUnits(amountOutMin, 6)} USDC`);

                    // Initialize Nox Handle Client for Arbitrum Sepolia Rebalance
                    console.log("🔒 Initializing Nox Handle Client...");
                    const handleClient = await createEthersHandleClient(wallet);
                    
                    // Encrypt inputs
                    console.log("🔒 Encrypting target ticks...");
                    const { handle: handleLower, handleProof: proofLower } = await handleClient.encryptInput(
                        BigInt(tickLower),
                        "int256",
                        VAULT_ADDRESS
                    );
                    const { handle: handleUpper, handleProof: proofUpper } = await handleClient.encryptInput(
                        BigInt(tickUpper),
                        "int256",
                        VAULT_ADDRESS
                    );
                    
                    // Request rebalance on-chain
                    console.log(`🔒 Requesting rebalance on-chain...`);
                    const txRebalance = await vault.rebalance(
                        handleLower,
                        proofLower,
                        handleUpper,
                        proofUpper,
                        { gasLimit: 2500000 }
                    );
                    process.stdout.write(`Request Tx: ${txRebalance.hash} ... `);
                    await txRebalance.wait();
                    console.log("✅ REQUEST CONFIRMED");
                    
                    console.log("⏳ Waiting 10s for block confirmation and off-chain Gateway indexing...");
                    await new Promise(r => setTimeout(r, 10000));
                    
                    // Fetch public decryption proofs
                    console.log("🔓 Fetching public decryption proofs from Handle Gateway...");
                    const { decryptionProof: decProofLower } = await handleClient.publicDecrypt(handleLower);
                    const { decryptionProof: decProofUpper } = await handleClient.publicDecrypt(handleUpper);
                    
                    // Execute rebalance on-chain
                    console.log(`🔓 Executing rebalance on-chain...`);
                    const txExecute = await vault.executeRebalance(
                        handleLower,
                        decProofLower,
                        handleUpper,
                        decProofUpper,
                        { gasLimit: 2500000 }
                    );
                    process.stdout.write(`Execute Tx: ${txExecute.hash} ... `);
                    await txExecute.wait();
                    console.log("✅ EXECUTION COMPLETE");
                    
                    console.log("⏳ Waiting 5s for RPC propagation...");
                    await new Promise(r => setTimeout(r, 5000));
                } catch (rebalanceError) {
                    console.error("\n❌ Ritual Failed:", rebalanceError);
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