import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0xEB118d8E3dB55fA1a2764A8A7144905B26680c68";

const VAULT_ABI = [
    "function sLastPositionId() view returns (uint256)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    const positionId = await vault.sLastPositionId();

    console.log("\n📍 YieldVault Position ID Check\n");
    console.log(`Last Position ID: ${positionId}\n`);

    if (positionId === 0n) {
        console.log("✅ No prior position - this is a FIRST rebalance");
        console.log("   Rebalance will skip decreaseLiquidity and create first position");
    } else {
        console.log(`⚠️  Prior position exists: NFT #${positionId}`);
        console.log("   Rebalance will try to decrease this position first");
        console.log(`   Check position: https://sepolia.etherscan.io/nft/0x1238536071E1c677A632429e3655c799b22cDA52/${positionId}`);
    }
}

main().catch(console.error);
