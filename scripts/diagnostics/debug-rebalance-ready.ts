import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;
const POOL_ADDRESS = "0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Output Buffer
    let output = "🔍 DIAGNOSTIC RESULTS 🔍\n";
    const log = (msg: string) => { output += msg + "\n"; console.log(msg); };

    // 1. Check Pool
    const pool = new ethers.Contract(POOL_ADDRESS, [
        "function fee() view returns (uint24)",
        "function tickSpacing() view returns (int24)",
        "function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)"
    ], provider);

    try {
        const fee = await pool.fee();
        const tickSpacing = await pool.tickSpacing();
        const slot0 = await pool.slot0();
        const tick = slot0[1];

        log(`\n🏊 Pool Details (${POOL_ADDRESS}):`);
        log(`   Fee:          ${fee} ${fee == 3000n ? "✅ MATCHES" : "❌ MISMATCH"}`);
        log(`   TickSpacing:  ${tickSpacing}`);
        log(`   Current Tick: ${tick}`);
    } catch (e: any) { log(`   ❌ Pool Error: ${e.message}`); }

    // 2. Check Vault Balances
    const weth = new ethers.Contract(CONTRACTS.WETH.address, ["function balanceOf(address) view returns (uint256)"], provider);
    const usdc = new ethers.Contract(CONTRACTS.USDC.address, ["function balanceOf(address) view returns (uint256)"], provider);

    try {
        const wethBal = await weth.balanceOf(VAULT_ADDRESS);
        const usdcBal = await usdc.balanceOf(VAULT_ADDRESS);

        log(`\n🏦 Vault Balances (${VAULT_ADDRESS}):`);
        log(`   WETH: ${ethers.formatUnits(wethBal, 18)}`);
        log(`   USDC: ${ethers.formatUnits(usdcBal, 6)}`);

        if (wethBal == 0n || usdcBal == 0n) {
            log("\n   🚨 CRITICAL: A balance is ZERO. In-Range minting requires BOTH assets.");
        } else {
            log("\n   ✅ Balances sufficient (non-zero).");
        }
    } catch (e: any) { log(`   ❌ Balance Check Error: ${e.message}`); }

    // Write to file (using process.cwd() as root)
    const uploadPath = path.join(process.cwd(), "scripts", "diagnostics", "results.txt");
    fs.writeFileSync(uploadPath, output);
    console.log(`\nWritten to ${uploadPath}`);
}

main().catch(console.error);
