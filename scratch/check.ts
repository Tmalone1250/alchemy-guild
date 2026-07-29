import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const VAULT_ADDRESS = "0x8BBb7F1a9e5bbeC35D1bc121E761e33F530284C2";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, [
        "function activePositions(uint256 index) external view returns (uint256)",
        "function sLastPositionId() external view returns (uint256)"
    ], provider);

    try {
        let i = 0;
        while(true) {
            const pos = await vault.activePositions(i);
            console.log(`Position ${i}: ${pos}`);
            i++;
        }
    } catch (e) {
        console.log(`Total active positions: ${i}`);
    }
}
main();
