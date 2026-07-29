import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const VAULT_ADDRESS = "0x38DF852703420c804535d7Cf1DD3C0aCe36DDF47";
const BOT_PK = process.env.BOT_PRIVATE_KEY!;

const VAULT_ABI = [
    "function activePositions(uint256) view returns (uint256)",
    "function WETH() view returns (address)",
    "function GUILD() view returns (address)",
    "function USDT() view returns (address)",
    "function USDC() view returns (address)",
    "function SWAP_ROUTER() view returns (address)",
    "function POSITION_MANAGER() view returns (address)"
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address, uint256) external returns (bool)"
];

const NFPM_ABI = [
    "function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)"
];

const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    const pm = await vault.POSITION_MANAGER();
    const router = await vault.SWAP_ROUTER();

    const nfpm = new ethers.Contract(pm, NFPM_ABI, provider);
    const swapRouter = new ethers.Contract(router, ROUTER_ABI, provider);

    const weth = await vault.WETH();
    const guild = await vault.GUILD();
    const usdt = await vault.USDT();
    const usdc = await vault.USDC();

    // 1. Collect
    console.log("Checking collects...");
    for (let i = 0; i < 3; i++) {
        const pos = await vault.activePositions(i);
        const params = {
            tokenId: pos,
            recipient: VAULT_ADDRESS,
            amount0Max: ethers.MaxUint256, // type(uint128).max is close enough, let's just use 2^128-1
            amount1Max: ethers.MaxUint256
        };
        // wait, we can't call collect via staticCall easily if we aren't the owner, but we can use eth_call with "from"
        try {
            await provider.call({
                to: pm,
                from: VAULT_ADDRESS,
                data: nfpm.interface.encodeFunctionData("collect", [{
                    tokenId: pos,
                    recipient: VAULT_ADDRESS,
                    amount0Max: 2n**128n - 1n,
                    amount1Max: 2n**128n - 1n
                }])
            });
            console.log(`Collect ${pos} OK`);
        } catch(e: any) {
            console.log(`Collect ${pos} FAILED:`, e.message);
        }
    }

    // 2. Swaps
    const WETH = new ethers.Contract(weth, ERC20_ABI, provider);
    const GUILD = new ethers.Contract(guild, ERC20_ABI, provider);
    const USDT = new ethers.Contract(usdt, ERC20_ABI, provider);

    const wethBal = await WETH.balanceOf(VAULT_ADDRESS);
    const guildBal = await GUILD.balanceOf(VAULT_ADDRESS);
    const usdtBal = await USDT.balanceOf(VAULT_ADDRESS);

    console.log("Vault balances:", {
        weth: wethBal.toString(),
        guild: guildBal.toString(),
        usdt: usdtBal.toString()
    });

    const trySwap = async (tokenIn: string, tokenOut: string, amount: bigint, fee: number) => {
        if (amount === 0n) {
            console.log(`Skipping ${tokenIn} -> ${tokenOut} (0 amount)`);
            return;
        }
        try {
            await provider.call({
                to: router,
                from: VAULT_ADDRESS,
                data: swapRouter.interface.encodeFunctionData("exactInputSingle", [{
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    fee: fee,
                    recipient: VAULT_ADDRESS,
                    amountIn: amount,
                    amountOutMinimum: 0n,
                    sqrtPriceLimitX96: 0n
                }])
            });
            console.log(`Swap ${tokenIn} -> ${tokenOut} OK`);
        } catch(e: any) {
            console.log(`Swap ${tokenIn} -> ${tokenOut} FAILED:`, e.message);
        }
    };

    // Let's use eth_call state overrides to simulate the ENTIRE harvest!
    // But since ethers.js V6 doesn't easily support state overrides out of the box, let's just do a manual trace.
    // Wait, let's just simulate the swaps one by one. 
    // Wait! Since it reverted in simulate-harvest.ts, let's modify simulate-harvest.ts to use Custom Error decoding,
    // Or just console.log the raw revert data.

    const res = await provider.call({
        to: VAULT_ADDRESS,
        from: BOT_PK ? wallet.address : undefined,
        data: vault.interface.encodeFunctionData("harvestAndDistribute")
    }).catch(e => {
        console.log("Revert Data from eth_call:", e.data);
    });
    console.log("End trace.");
}

main().catch(console.error);
