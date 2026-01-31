import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { PAYMASTER_ADDRESS } from "./src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const PAYMASTER_ABI = [
    "function owner() view returns (address)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, provider);

    console.log(`\n🔍 Checking Paymaster Ownership...`);
    console.log(`Paymaster Address: ${PAYMASTER_ADDRESS}`);
    
    try {
        const owner = await paymaster.owner();
        console.log(`Contract Owner:  ${owner}`);
        console.log(`Your Wallet:     ${wallet.address}`);
        
        if (owner.toLowerCase() === wallet.address.toLowerCase()) {
            console.log(`✅ MATCH! You are the owner.`);
        } else {
            console.log(`❌ MISMATCH! You are NOT the owner.`);
            console.log(`👉 You must use the wallet ending in ...${owner.slice(-4)} to whitelist contracts.`);
        }
    } catch (e) {
        console.log(`❌ Error fetching owner: ${e.message}`);
    }
}

main().catch(console.error);
