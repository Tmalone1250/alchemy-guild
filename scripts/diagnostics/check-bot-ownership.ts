import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;

const ABI = ["function owner() view returns (address)"];

import * as fs from 'fs';
import * as path from 'path';

// ... (keep logic)

async function main() {
    // ... setup ...
    let output = "";
    const log = (msg: string) => { output += msg + "\n"; console.log(msg); };

    if (!BOT_PRIVATE_KEY) {
        log("❌ Missing BOT_PRIVATE_KEY in .env");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const botWallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);
    const vault = new ethers.Contract(VAULT_ADDRESS, ABI, provider);

    log(`\n🔍 Checking Bot Ownership for: ${VAULT_ADDRESS}`);
    log(`   🤖 Bot Address:  ${botWallet.address}`);

    try {
        const owner = await vault.owner();
        log(`   👑 Vault Owner:  ${owner}`);

        if (owner.toLowerCase() === botWallet.address.toLowerCase()) {
            log("\n✅ MATCH! The Bot IS the owner. 'rebalance()' will work.");
        } else {
            log("\n❌ MISMATCH! The Bot cannot call 'rebalance()'.");
            log("\n🚀 ACTION REQUIRED:");
            log("Run this command in your WSL / Forge terminal (where you deployed):");
            log("---------------------------------------------------------------");
            log(`cast send ${VAULT_ADDRESS} "transferOwnership(address)" ${botWallet.address} --rpc-url ${RPC_URL} --private-key $PRIVATE_KEY`);
            log("---------------------------------------------------------------");
        }

    } catch (e: any) {
        log(`❌ Check Failed: ${e.message}`);
    }

    const uploadPath = path.join(process.cwd(), "scripts", "diagnostics", "ownership_status.txt");
    fs.writeFileSync(uploadPath, output);
    console.log(`\nWritten to ${uploadPath}`);
}

main().catch(console.error);
