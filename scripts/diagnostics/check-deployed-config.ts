import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;

const ABI = [
    "function POOL() view returns (address)",
    "function POSITION_MANAGER() view returns (address)",
    "function SWAP_ROUTER() view returns (address)",
    "function WETH() view returns (address)",
    "function USDC() view returns (address)",
    "function PAYMASTER() view returns (address)",
    "function ENTRY_POINT() view returns (address)" // Added checks for everything
];

// Expected Values (Sepolia)
const EXPECTED = {
    POOL: "0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50",
    POSITION_MANAGER: "0x1238536071e1C6776046042168d412e43F539616",
    SWAP_ROUTER: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
    WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
};

import * as fs from 'fs';
import * as path from 'path';

// ... (keep headers)

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, ABI, provider);
    
    let output = "";
    const log = (msg: string) => { output += msg + "\n"; console.log(msg); };

    log(`\n🔍 Checking Deployed Config for: ${VAULT_ADDRESS}`);

    try {
        const pool = await vault.POOL();
        const pm = await vault.POSITION_MANAGER();
        const router = await vault.SWAP_ROUTER();
        const weth = await vault.WETH();
        const usdc = await vault.USDC();
        const paymaster = await vault.PAYMASTER();
        
        log(`\n🧩 Configuration:`);
        
        const check = (name: string, actual: string, expected: string) => {
            if (actual.toLowerCase() === expected.toLowerCase()) {
                log(`   ✅ ${name}: ${actual}`);
            } else {
                log(`   ❌ ${name} MISMATCH!`);
                log(`      Actual:   ${actual}`);
                log(`      Expected: ${expected}`);
            }
        };

        check("POOL", pool, EXPECTED.POOL);
        check("POSITION_MANAGER", pm, EXPECTED.POSITION_MANAGER);
        check("SWAP_ROUTER", router, EXPECTED.SWAP_ROUTER);
        check("WETH", weth, EXPECTED.WETH);
        check("USDC", usdc, EXPECTED.USDC);
        
        log(`\n   PAYMASTER:    ${paymaster}`);

        const poolCode = await provider.getCode(pool);
        if (poolCode === "0x") {
             log("   ❌ CRITICAL: POOL address has NO CODE!");
        } else {
             log("   ✅ POOL contract exists on-chain.");
        }

    } catch (e: any) {
        log(`❌ Read Failed: ${e.message}`);
    }

    const uploadPath = path.join(process.cwd(), "scripts", "diagnostics", "config_results.txt");
    fs.writeFileSync(uploadPath, output);
    console.log(`\nWritten to ${uploadPath}`);
}

main().catch(console.error);
