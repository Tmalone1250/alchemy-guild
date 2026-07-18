import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const PM_ADDRESS = "0x1238536071e1C6776046042168d412e43F539616"; // Position Manager
const POOL_ADDRESS = "0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50";

const ERC20_ABI = ["function approve(address, uint256) external returns (bool)", "function balanceOf(address) view returns (uint256)"];
const PM_ABI = [
    "struct MintParams { address token0; address token1; uint24 fee; int24 tickLower; int24 tickUpper; uint256 amount0Desired; uint256 amount1Desired; uint256 amount0Min; uint256 amount1Min; address recipient; uint256 deadline; }",
    "function mint(MintParams calldata params) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
];
const POOL_ABI = ["function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)", "function tickSpacing() view returns (int24)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const pm = new ethers.Contract(PM_ADDRESS, PM_ABI, wallet);
    const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

    const usdc = new ethers.Contract(CONTRACTS.USDC.address, ERC20_ABI, wallet);
    const weth = new ethers.Contract(CONTRACTS.WETH.address, ERC20_ABI, wallet);

    console.log("🔍 Simulating Direct Mint (User Wallet)");

    // 1. Get Pool Data
    const slot0 = await pool.slot0();
    const tick = Number(slot0[1]);
    const tickSpacing = Number(await pool.tickSpacing());
    console.log(`   Tick: ${tick}, Spacing: ${tickSpacing}`);
    
    // 2. Calculate Params (Same logic as YieldVault)
    const _getNearestUsableTick = (t: number, s: number) => {
        let rounded = Math.floor(t / s) * s;
        if (t < 0 && t % s !== 0) rounded -= s;
        return rounded;
    };

    const usableTick = _getNearestUsableTick(tick, tickSpacing);
    const tickLower = usableTick - ((500 / tickSpacing) * tickSpacing); // 8 * 60 = 480
    const tickUpper = usableTick + ((500 / tickSpacing) * tickSpacing);
    
    console.log(`   Range: [${tickLower}, ${tickUpper}]`);

    // 3. Approve
    const amount0 = ethers.parseUnits("16000", 6); // 16k USDC
    const amount1 = ethers.parseUnits("0.1", 18);  // 0.1 ETH
    
    console.log("   Approving PM...");
    await (await usdc.approve(PM_ADDRESS, amount0)).wait();
    await (await weth.approve(PM_ADDRESS, amount1)).wait();

    // 4. Mint
    console.log("   Calling Mint...");
    const params = {
        token0: CONTRACTS.USDC.address,
        token1: CONTRACTS.WETH.address,
        fee: 3000,
        tickLower: BigInt(tickLower),
        tickUpper: BigInt(tickUpper),
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min: 0n,
        amount1Min: 0n,
        recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 120 // 2 mins buffer
    };

    try {
        const tx = await pm.mint(params, { gasLimit: 2000000 });
        console.log(`   🚀 Tx Sent: ${tx.hash}`);
        await tx.wait();
        console.log("   ✅ Direct Mint SUCCESS!");
    } catch (e: any) {
        console.error("   ❌ Direct Mint FAILED:", e.message);
        if (e.data) {
             console.error(`   Data: ${e.data}`);
        }
    }
}

main().catch(console.error);
