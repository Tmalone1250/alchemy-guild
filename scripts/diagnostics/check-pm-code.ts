import { ethers } from "ethers";
import dotenv from "dotenv";
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const PM_ADDRESS = "0x1238536071E1c677A632429e3655c799b22cDA52"; // Correct Sepolia Address

async function main() {
    let output = "";
    const log = (msg: string) => { output += msg + "\n"; console.log(msg); };

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    log(`\n🔍 Checking Code at: ${PM_ADDRESS}`);
    
    try {
        const code = await provider.getCode(PM_ADDRESS);
        log(`   Bytes: ${code.length}`);
        
        if (code === "0x") {
            log("   ❌ ERROR: Address has NO CODE (EOA or Empty).");
        } else {
            log("   ✅ SUCCESS: Address contains code.");
            log(`   Sample: ${code.slice(0, 50)}...`);
        }

    } catch (e: any) {
        log(`❌ Check Failed: ${e.message}`);
    }

    const uploadPath = path.join(process.cwd(), "scripts", "diagnostics", "pm_code_status.txt");
    fs.writeFileSync(uploadPath, output);
    console.log(`\nWritten to ${uploadPath}`);
}

main().catch(console.error);
