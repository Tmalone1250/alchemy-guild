import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";

const ELEMENT_NFT_ADDRESS = CONTRACTS.ElementNFT.address;
const NEW_VAULT_ADDRESS = CONTRACTS.YieldVault.address;
// Adding the Old Vault address for reference (from previous context)
const OLD_VAULT_ADDRESS = "0x11Ea6777Ff9cC8bc05c0cd54B646D5052ff18899"; 

const ABI = [
    "function totalSupply() external view returns (uint256)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function tokenByIndex(uint256 index) external view returns (uint256)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const nftContract = new ethers.Contract(ELEMENT_NFT_ADDRESS, ABI, provider);

    console.log("🔍 Starting NFT Ownership Audit...");
    console.log(`NFT Contract: ${ELEMENT_NFT_ADDRESS}`);
    console.log(`New Vault:    ${NEW_VAULT_ADDRESS}`);
    console.log(`Old Vault:    ${OLD_VAULT_ADDRESS}`);

    try {
        const totalSupply = await nftContract.totalSupply();
        console.log(`\n📊 Total Supply: ${totalSupply.toString()} NFTs`);

        for (let i = 0; i < totalSupply; i++) {
            const tokenId = await nftContract.tokenByIndex(i);
            const owner = await nftContract.ownerOf(tokenId);
            
            let status = "👤 User Wallet";
            if (owner.toLowerCase() === NEW_VAULT_ADDRESS.toLowerCase()) status = "✅ NEW VAULT (Staked)";
            if (owner.toLowerCase() === OLD_VAULT_ADDRESS.toLowerCase()) status = "⚠️ OLD VAULT (Staked/Stuck)";

            console.log(`   - Token #${tokenId}: ${status} (${owner})`);
        }

    } catch (error) {
        console.error("❌ Audit Failed:", error);
    }
}

main().catch(console.error);
