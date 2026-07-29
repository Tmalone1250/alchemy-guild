import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const VAULT_ADDRESS = "0x8BBb7F1a9e5bbeC35D1bc121E761e33F530284C2";
const POSITION_MANAGER = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";

const NFPM_ABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
    "function safeTransferFrom(address from, address to, uint256 tokenId) external"
];

async function main() {
    if (!BOT_PRIVATE_KEY) throw new Error("Missing BOT_PRIVATE_KEY");
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);

    const nfpm = new ethers.Contract(POSITION_MANAGER, NFPM_ABI, wallet);

    console.log(`Checking NFTs owned by bot wallet: ${wallet.address}`);
    const balance = await nfpm.balanceOf(wallet.address);
    console.log(`Bot wallet owns ${balance} NFTs`);

    for (let i = Number(balance) - 1; i >= 0; i--) {
        const tokenId = await nfpm.tokenOfOwnerByIndex(wallet.address, i);
        console.log(`Transferring Token ID: ${tokenId} to YieldVault...`);
        const tx = await nfpm.safeTransferFrom(wallet.address, VAULT_ADDRESS, tokenId);
        await tx.wait();
        console.log(`✅ Token ID ${tokenId} transferred!`);
    }

    console.log("Done.");
}

main().catch(console.error);
