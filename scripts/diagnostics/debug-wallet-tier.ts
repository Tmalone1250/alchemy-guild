import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// Configuration
const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const ELEMENT_NFT_ADDRESS = "0x2BFbf65eFEbEae93cbBEb791ed93fF8DEb4E02b9"; // The NEW one
const USER_ADDRESS = "0xc8B3A30Dc748FB44234405Ae42eBb444f78193E0"; // The User's Wallet

const ABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
    "function getTokenTier(uint256 tokenId) external view returns (uint8)"
];

async function main() {
    console.log("🔍 Starting Independent Wallet Audit...");
    console.log(`📡 Connecting to RPC: ${RPC_URL}`);
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(ELEMENT_NFT_ADDRESS, ABI, provider);

    console.log(`🎯 Checking Address: ${USER_ADDRESS}`);
    console.log(`📝 Contract: ${ELEMENT_NFT_ADDRESS}`);

    try {
        const balance = await contract.balanceOf(USER_ADDRESS);
        console.log(`\n💰 BALANCE: ${balance.toString()} NFTs`);

        if (balance > 0n) {
            for (let i = 0; i < balance; i++) {
                const tokenId = await contract.tokenOfOwnerByIndex(USER_ADDRESS, i);
                const tier = await contract.getTokenTier(tokenId);
                console.log(`   - Token ID: ${tokenId} | Tier: ${tier}`);
            }
        } else {
            console.log("❌ User holds 0 NFTs in this wallet.");
            console.log("   (Are they sure they unstaked? Or is it in a different wallet?)");
        }

    } catch (error) {
        console.error("\n❌ ERROR:", error);
    }
}

main().catch(console.error);
