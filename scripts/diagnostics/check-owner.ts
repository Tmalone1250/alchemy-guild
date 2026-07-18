import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;

const ABI = [
    "function owner() view returns (address)"
];

import * as fs from 'fs';
import * as path from 'path';

// ... (keep logic)

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const vault = new ethers.Contract(VAULT_ADDRESS, ABI, provider);

    let output = "";
    const log = (msg: string) => { output += msg + "\n"; console.log(msg); };

    log(`\n🔍 Checking Owner of Check Owner of YieldVault: ${VAULT_ADDRESS}`);
    log(`   Signer (You):  ${wallet.address}`);

    try {
        const owner = await vault.owner();
        log(`   Actual Owner:  ${owner}`);

        if (owner.toLowerCase() === wallet.address.toLowerCase()) {
            log("\n✅ MATCH! You are the owner.");
        } else {
            log("\n❌ MISMATCH! You are NOT the owner.");
            log("   The contract was deployed by a different wallet.");
            log("   Please check if your WSL .env matches your Windows .env or if Forge used a different key.");
        }

    } catch (e: any) {
        log(`❌ Check Failed: ${e.message}`);
    }

    const uploadPath = path.join(process.cwd(), "scripts", "diagnostics", "owner_results.txt");
    fs.writeFileSync(uploadPath, output);
    console.log(`\nWritten to ${uploadPath}`);
}

main().catch(console.error);
