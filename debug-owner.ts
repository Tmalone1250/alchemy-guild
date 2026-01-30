
import { ethers } from "ethers";
import { PAYMASTER_ADDRESS } from "./src/config/contracts.js";
import 'dotenv/config';

const ABI = [
    "function owner() external view returns (address)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log("Wallet:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");

    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, ABI, provider);
    const owner = await paymaster.owner();
    console.log("Paymaster Owner:", owner);

    if (wallet.address.toLowerCase() === owner.toLowerCase()) {
        console.log("✅ Wallet IS Owner. Can update whitelist.");
    } else {
        console.log("❌ Wallet IS NOT Owner. Cannot update whitelist.");
    }
}

main().catch(console.error);
