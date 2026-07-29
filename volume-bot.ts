import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// --- Configuration ---
const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const SWAP_ROUTER_ADDRESS = "0x101F443B4d1b059569D643917553c771E1b9663E";

const WETH_ADDRESS = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const VAULT_ADDRESS = "0x38DF852703420c804535d7Cf1DD3C0aCe36DDF47";
const GUILD_ADDRESS = "0xe2026C28F0F1DaFAbdd10823c54a411590b4f190";

// --- ABIs ---
const VAULT_ABI = [
    "function harvestAndDistribute() external"
];
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function deposit() external payable",
];
const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
];

async function attemptSwap(router: ethers.Contract, tokenIn: string, tokenOut: string, fee: number, amountIn: bigint, wallet: ethers.Wallet, maxRetries = 3) {
    if (amountIn === 0n) return 0n;

    const swapParams = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: fee,
        recipient: wallet.address,
        amountIn: amountIn,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
    };

    for (let i = 0; i < maxRetries; i++) {
        try {
            const tx = await router.exactInputSingle(swapParams, { gasLimit: 800000 });
            process.stdout.write(`Swap Tx: ${tx.hash} ... `);
            await tx.wait();
            console.log("✅ Confirmed");
            return amountIn; // Indicates success
        } catch (e: any) {
            console.error(`\n❌ Swap Failed (Attempt ${i+1}/${maxRetries}):`, e.message || e);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
    return 0n;
}

async function checkAllowance(token: ethers.Contract, walletAddress: string, routerAddress: string) {
    const allowance = await token.allowance(walletAddress, routerAddress);
    if (allowance < ethers.MaxUint256 / 2n) {
        console.log(`⚠️ Approving Router for ${await token.getAddress()}...`);
        await (await token.approve(routerAddress, ethers.MaxUint256)).wait();
    }
}

async function main() {
    if (!BOT_PRIVATE_KEY || !RPC_URL) throw new Error("Missing env vars: BOT_PRIVATE_KEY and ARBITRUM_SEPOLIA_RPC_URL required");

    // Extract newly deployed Vault and USDT addresses from config or arguments.
    // For simplicity, we assume they are provided in .env after seed script runs.
    const VAULT_ADDRESS = process.env.VAULT_ADDRESS;
    const USDT_ADDRESS = process.env.USDT_ADDRESS;

    if (!VAULT_ADDRESS || !USDT_ADDRESS) {
        throw new Error("Missing VAULT_ADDRESS or USDT_ADDRESS in .env");
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);

    console.log(`\n🤖 Bot Active: ${wallet.address}`);
    console.log(`🏦 YieldVault: ${VAULT_ADDRESS}`);

    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);
    const router = new ethers.Contract(SWAP_ROUTER_ADDRESS, ROUTER_ABI, wallet);
    
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, wallet);
    const guild = new ethers.Contract(GUILD_ADDRESS, ERC20_ABI, wallet);

    // --- Approvals ---
    await checkAllowance(weth, wallet.address, SWAP_ROUTER_ADDRESS);
    await checkAllowance(usdc, wallet.address, SWAP_ROUTER_ADDRESS);
    await checkAllowance(usdt, wallet.address, SWAP_ROUTER_ADDRESS);
    await checkAllowance(guild, wallet.address, SWAP_ROUTER_ADDRESS);

    // --- THE LOOP ---
    console.log("\n--- 🏁 Starting Omnichannel Loop ---");
    let cycle = 1;

    while (true) {
        try {
            console.log(`\n--- ⚗️ Cycle #${cycle} ---`);

            // Auto-wrap ETH if WETH is low
            const ethBalance = await provider.getBalance(wallet.address);
            const wethBalance = await weth.balanceOf(wallet.address);
            if (wethBalance < ethers.parseEther("0.02") && ethBalance > ethers.parseEther("0.05")) {
                console.log("⛽ Auto-wrapping 0.05 ETH for fuel...");
                await (await weth.deposit({ value: ethers.parseEther("0.05") })).wait();
            }

            // Route 1 (Stables): 10 USDC -> USDT -> USDC (Fee 500)
            console.log(`\n🌊 Route 1 (Stables)`);
            const usdcBal = await usdc.balanceOf(wallet.address);
            if (usdcBal >= ethers.parseUnits("10", 6)) {
                const usdtBefore = await usdt.balanceOf(wallet.address);
                await attemptSwap(router, USDC_ADDRESS, USDT_ADDRESS, 500, ethers.parseUnits("10", 6), wallet);
                const usdtAfter = await usdt.balanceOf(wallet.address);
                const usdtGained = usdtAfter - usdtBefore;
                if (usdtGained > 0n) {
                    await attemptSwap(router, USDT_ADDRESS, USDC_ADDRESS, 500, usdtGained, wallet);
                }
            } else {
                console.log("Skipping Route 1: Insufficient USDC");
            }

            // Route 2 (Blue-Chips): 0.01 WETH -> USDC -> WETH (Fee 3000)
            console.log(`\n🌊 Route 2 (Blue-Chips)`);
            const wethBal2 = await weth.balanceOf(wallet.address);
            if (wethBal2 >= ethers.parseEther("0.01")) {
                const usdcBefore2 = await usdc.balanceOf(wallet.address);
                await attemptSwap(router, WETH_ADDRESS, USDC_ADDRESS, 3000, ethers.parseEther("0.01"), wallet);
                const usdcAfter2 = await usdc.balanceOf(wallet.address);
                const usdcGained2 = usdcAfter2 - usdcBefore2;
                if (usdcGained2 > 0n) {
                    await attemptSwap(router, USDC_ADDRESS, WETH_ADDRESS, 3000, usdcGained2, wallet);
                }
            } else {
                console.log("Skipping Route 2: Insufficient WETH");
            }

            // Route 3 (Degen): 0.01 WETH -> GUILD -> WETH (Fee 10000)
            console.log(`\n🌊 Route 3 (Degen)`);
            const wethBal3 = await weth.balanceOf(wallet.address);
            if (wethBal3 >= ethers.parseEther("0.01")) {
                const guildBefore = await guild.balanceOf(wallet.address);
                await attemptSwap(router, WETH_ADDRESS, GUILD_ADDRESS, 10000, ethers.parseEther("0.01"), wallet);
                const guildAfter = await guild.balanceOf(wallet.address);
                const guildGained = guildAfter - guildBefore;
                if (guildGained > 0n) {
                    await attemptSwap(router, GUILD_ADDRESS, WETH_ADDRESS, 10000, guildGained, wallet);
                }
            } else {
                console.log("Skipping Route 3: Insufficient WETH");
            }

            // --- The Harvest ---
            if (cycle % 10 === 0) {
                console.log(`\n🔥 TRIGGERING HARVEST AND DISTRIBUTE`);
                try {
                    const txHarvest = await vault.harvestAndDistribute({ gasLimit: 2500000 });
                    process.stdout.write(`Harvest Tx: ${txHarvest.hash} ... `);
                    await txHarvest.wait();
                    console.log("✅ HARVEST COMPLETE");
                } catch (err: any) {
                    console.error("\n❌ Harvest Failed:", err.message || err);
                }
            }

            cycle++;
            process.stdout.write("Sleeping 20s...\n");
            await new Promise(r => setTimeout(r, 20000));

        } catch (err: any) {
            console.error("\n❌ Cycle Error:", err.message || err);
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

main().catch(console.error);