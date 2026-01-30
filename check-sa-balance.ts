import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const SMART_ACCOUNT = "0x381e88BCD3510c592c04302fEdB1a570e422252C";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log(`Checking balance of ${SMART_ACCOUNT}...`);
    
    const balance = await provider.getBalance(SMART_ACCOUNT);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance === BigInt(0)) {
        console.log("❌ ZERO BALANCE. Cannot perform payable transactions (Mint 0.002 ETH).");
    } else {
        console.log("✅ Has balance.");
    }
}

main().catch(console.error);
