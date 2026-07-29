import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const VAULT_ADDRESS = "0x38DF852703420c804535d7Cf1DD3C0aCe36DDF47";

const VAULT_ABI = [
    "function activePositions(uint256) view returns (uint256)",
    "function getActivePositionsLength() view returns (uint256)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    // Since activePositions is a public array, we can't get its length directly without a getter or by checking indices.
    // Instead, we can just try to read activePositions(0), (1), etc.
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
    let i = 0;
    try {
        while (true) {
            const pos = await vault.activePositions(i);
            console.log(`Position ${i}: ${pos}`);
            i++;
        }
    } catch (e) {
        console.log(`Total active positions: ${i}`);
    }
}

main().catch(console.error);
