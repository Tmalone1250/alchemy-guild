import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const USDC_ADDRESS = CONTRACTS.USDC.address; // 0x1c...
const WETH_ADDRESS = CONTRACTS.WETH.address; // 0xfF...
const POOL_ADDRESS = "0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50";

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function symbol() view returns (string)"
];

const POOL_ABI = [
    "function token0() view returns (address)",
    "function token1() view returns (address)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    
    // Initialize Contracts
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

    // Logging setup
    let output = "🔍 DIAGNOSTICS RESULTS\n";
    const log = (msg: string) => { output += msg + "\n"; console.log(msg); };

    log("🔍 DIAGNOSTICS: Contract Interactions");

    // 1. Check Pool Token Order
    log("\n1️⃣ Checking Pool Token Order...");
    try {
        const t0 = await pool.token0();
        const t1 = await pool.token1();
        log(`   Pool Token0: ${t0}`);
        log(`   Pool Token1: ${t1}`);
        
        const myUSDC = USDC_ADDRESS;
        const myWETH = WETH_ADDRESS;

        if (t0.toLowerCase() === myUSDC.toLowerCase() && t1.toLowerCase() === myWETH.toLowerCase()) {
            log("   ✅ Order Correct (USDC is Token0)");
        } else {
            log("   ❌ ORDER MISMATCH! Vault assumes USDC is Token0.");
        }
    } catch (e: any) {
        log(`   ❌ Pool Check Failed: ${e.message}`);
    }

    // 2. Test USDC Approve
    log("\n2️⃣ Testing USDC 'approve'...");
    try {
        // Approve self for 1 wei
        log(`   Calling approve(self, 1) on ${USDC_ADDRESS}...`);
        // We use callStatic to check return value without spending gas
        const success = await usdc.approve.staticCall(wallet.address, 1n);
        log(`   Return Value: ${success}`);
        
        if (success === true) {
             log("   ✅ USDC returns 'true'. Standard behavior.");
        } else {
             log(`   ⚠️ USDC returned: ${success}`);
        }
    } catch (e: any) {
        log(`   ❌ USDC Approve Failed (Likely Non-Standard):`);
        log(`      Error: ${e.message}`);
        log("      Note: If this fails, YieldVault MUST use SafeApprove.");
    }

    const uploadPath = path.join(process.cwd(), "scripts", "diagnostics", "interaction_results.txt");
    fs.writeFileSync(uploadPath, output);
    console.log(`\nWritten to ${uploadPath}`);
}

main().catch(console.error);
