import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;
const NFT_ADDRESS = CONTRACTS.ElementNFT.address;

const ABI = [
    "function I_ELEMENT_NFT() view returns (address)"
];

import * as fs from 'fs';
import * as path from 'path';

// ... (keep headers)

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, ABI, provider);
    
    let output = "";
    const log = (msg: string) => { output += msg + "\n"; console.log(msg); };

    log(`\n🔍 Checking Vault Configuration`);
    log(`   Vault: ${VAULT_ADDRESS}`);

    try {
        const storedNftAddress = await vault.I_ELEMENT_NFT();
        log(`   I_ELEMENT_NFT: ${storedNftAddress}`);
        log(`   Expected:      ${NFT_ADDRESS}`);

        if (storedNftAddress === "0x0000000000000000000000000000000000000000") {
            log("\n❌ CRITICAL: NFT Address is ZERO! 'stake()' will fail.");
            log("   The deployment script missed the 'setElementNFT' step.");
        } else if (storedNftAddress.toLowerCase() === NFT_ADDRESS.toLowerCase()) {
            log("\n✅ Configuration Correct.");
        } else {
            log("\n⚠️ MISMATCH: Vault points to wrong NFT contract!");
        }

    } catch (e: any) {
        log(`❌ Read Failed: ${e.message}`);
    }

    const uploadPath = path.join(process.cwd(), "scripts", "diagnostics", "vault_nft_check.txt");
    fs.writeFileSync(uploadPath, output);
    console.log(`\nWritten to ${uploadPath}`);
}

main().catch(console.error);
