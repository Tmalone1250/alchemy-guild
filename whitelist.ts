import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { CONTRACTS } from "./src/config/contracts";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PAYMASTER_ADDRESS = "0x353A1d7795bAdA4727179c09216b0e7DEE8B83D3";

const PAYMASTER_ABI = [
    "function setSponsoredContract(address target, bool allowed) external",
    "function sponsoredContracts(address) view returns (bool)",
    "function owner() view returns (address)"
];

async function main() {
    if (!PRIVATE_KEY || !RPC_URL) throw new Error("Missing env vars");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, wallet);

    console.log(`User: ${wallet.address}`);
    
    // Check Owner
    const owner = await paymaster.owner();
    console.log(`Paymaster Owner: ${owner}`);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        console.error("❌ YOU ARE NOT THE OWNER! Cannot whitelist.");
        return;
    }

    const targets = [
        { name: "ElementNFT", address: CONTRACTS.ElementNFT.address },
        { name: "Alchemist", address: CONTRACTS.Alchemist.address }
    ];

    for (const t of targets) {
        console.log(`Checking ${t.name} (${t.address})...`);
        const isSponsored = await paymaster.sponsoredContracts(t.address);
        if (isSponsored) {
            console.log(`✅ Already sponsored.`);
        } else {
            console.log(`Whitelisting ${t.name}...`);
            const tx = await paymaster.setSponsoredContract(t.address, true);
            console.log(`Tx sent: ${tx.hash}`);
            await tx.wait();
            console.log(`✅ Whitelisted!`);
        }
    }
}

main().catch(console.error);
