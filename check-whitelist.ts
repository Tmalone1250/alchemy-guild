
import { ethers } from "ethers";
import { PAYMASTER_ADDRESS, CONTRACTS } from "./src/config/contracts.js";
import 'dotenv/config';

const PAYMASTER_ABI = [
    "function sponsoredContracts(address) external view returns (bool)"
];

const CONTRACTS_TO_CHECK = {
    "ElementNFT": CONTRACTS.ElementNFT.address,
    "Alchemist": CONTRACTS.Alchemist.address,
    "YieldVault": CONTRACTS.YieldVault.address,
};

async function main() {
    console.log("🔍 Checking Paymaster Whitelist Configuration...");
    console.log("Paymaster:", PAYMASTER_ADDRESS);

    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL);
    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, provider);

    for (const [name, address] of Object.entries(CONTRACTS_TO_CHECK)) {
        const isSponsored = await paymaster.sponsoredContracts(address);
        console.log(`[${isSponsored ? "✅" : "❌"}] ${name} (${address})`);
    }
}

main().catch(console.error);
