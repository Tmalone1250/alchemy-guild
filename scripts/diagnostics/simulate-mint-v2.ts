import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const PM_ADDRESS = "0x1238536071e1C6776046042168d412e43F539616"; // Position Manager
const POOL_ADDRESS = "0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50";

const ERC20_ABI = ["function approve(address, uint256) external returns (bool)", "function balanceOf(address) view returns (uint256)"];
// Simplifed ABI handling - use explicit tuple if needed, but standard struct usually works in v6 if formatted right.
// We'll pass the params as an object matching the struct components.
const PM_ABI = [
    "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
];
const POOL_ABI = ["function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)", "function tickSpacing() view returns (int24)"];

async function main() {
    let output = "🔍 SIMULATION RESULTS\n";
    const log = (msg: string) => { output += msg + "\n"; console.log(msg); };

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const pm = new ethers.Contract(PM_ADDRESS, PM_ABI, wallet);
    const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

    const usdc = new ethers.Contract(CONTRACTS.USDC.address, ERC20_ABI, wallet);
    const weth = new ethers.Contract(CONTRACTS.WETH.address, ERC20_ABI, wallet);

    log("🔍 Simulating Direct Mint (User Wallet)");

    // 1. Get Pool Data
    const slot0 = await pool.slot0();
    const tick = Number(slot0[1]);
    const tickSpacing = Number(await pool.tickSpacing());
    log(`   Tick: ${tick}, Spacing: ${tickSpacing}`);
    
    // 2. Calculate Params
    const _getNearestUsableTick = (t: number, s: number) => {
        let rounded = Math.floor(t / s) * s;
        if (t < 0 && t % s !== 0) rounded -= s;
        return rounded;
    };

    const usableTick = _getNearestUsableTick(tick, tickSpacing);
    const tickLower = usableTick - ((500 / tickSpacing) * tickSpacing);
    const tickUpper = usableTick + ((500 / tickSpacing) * tickSpacing);
    
    log(`   Range: [${tickLower}, ${tickUpper}]`);

    // 3. Approve
    const amount0 = ethers.parseUnits("16000", 6); // 16k USDC
    const amount1 = ethers.parseUnits("0.1", 18);  // 0.1 ETH
    
    log("   Approving PM...");
    try {
        await (await usdc.approve(PM_ADDRESS, amount0)).wait();
        await (await weth.approve(PM_ADDRESS, amount1)).wait();
        log("   ✅ Approved.");
    } catch (e) {
        log(`   ❌ Approval Failed: ${e}`);
    }

    // 4. Mint
    log("   Calling Mint...");
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
        deadline: Math.floor(Date.now() / 1000) + 300
    };

    try {
        const tx = await pm.mint(params, { gasLimit: 3000000 });
        log(`   🚀 Tx Sent: ${tx.hash}`);
        await tx.wait();
        log("   ✅ Direct Mint SUCCESS!");
    } catch (e: any) {
        log("   ❌ Direct Mint FAILED:");
        if (e.data) {
             log(`   Data: ${e.data}`);
             try {
                const reason = ethers.toUtf8String("0x" + e.data.slice(138));
                log(`   Decoded: ${reason}`);
             } catch {}
        }
        if (e.reason) log(`   Reason: ${e.reason}`);
        if (e.info?.error) log(`   Nested: ${e.info.error.message}`);
        log(`   Error: ${e.message}`);
    }

    const uploadPath = path.join(process.cwd(), "scripts", "diagnostics", "simulation_results.txt");
    fs.writeFileSync(uploadPath, output);
    console.log(`\nWritten to ${uploadPath}`);
}

main().catch(console.error);
