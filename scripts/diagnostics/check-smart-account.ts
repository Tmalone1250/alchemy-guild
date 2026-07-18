import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
// The Smart Account address from the logs
const ACCOUNT_ADDRESS = "0x49709cFC7B8F48B45693ca066430D983aE452c3D"; 
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;
const NFT_ADDRESS = CONTRACTS.ElementNFT.address;

const ERC721_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function getTokenTier(uint256 tokenId) view returns (uint8)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const nft = new ethers.Contract(NFT_ADDRESS, ERC721_ABI, provider);
    
    let output = "";
    const log = (msg: string) => { output += msg + "\n"; console.log(msg); };

    log(`\n🔍 Checking Smart Account: ${ACCOUNT_ADDRESS}`);
    log(`   Vault Address: ${VAULT_ADDRESS}`);

    try {
        const balance = await nft.balanceOf(ACCOUNT_ADDRESS);
        log(`   🖼️  NFT Balance: ${balance}`);

        if (balance > 0n) {
            log(`\n   📋 Owned Tokens:`);
            for (let i = 0; i < Number(balance); i++) {
                try {
                    // ElementNFT assumes Enumerable extension? 
                    // If not, we can't iterate easily without events.
                    // But standard template usually has it. Let's try.
                    const tokenId = await nft.tokenOfOwnerByIndex(ACCOUNT_ADDRESS, i);
                    const approved = await nft.getApproved(tokenId);
                    const tier = await nft.getTokenTier(tokenId);
                    const isApprovedAll = await nft.isApprovedForAll(ACCOUNT_ADDRESS, VAULT_ADDRESS);

                    log(`   - Token ID: ${tokenId}`);
                    log(`     Tier: ${tier}`);
                    log(`     Approved To: ${approved}`);
                    log(`     Appr. All:   ${isApprovedAll}`);
                    
                    if (approved.toLowerCase() === VAULT_ADDRESS.toLowerCase() || isApprovedAll) {
                        log(`     ✅ Approval VALID for Vault.`);
                    } else {
                        log(`     ❌ Approval INVALID. 'stake' will fail.`);
                    }
                } catch (e: any) {
                    log(`     ⚠️ Could not fetch token at index ${i}: ${e.message}`);
                }
            }
        } else {
            log("   ⚠️ No NFTs found in Smart Account. Did you mint first?");
        }

    } catch (e: any) {
        log(`❌ Check Failed: ${e.message}`);
    }

    const uploadPath = path.join(process.cwd(), "scripts", "diagnostics", "smart_account_check.txt");
    fs.writeFileSync(uploadPath, output);
    console.log(`\nWritten to ${uploadPath}`);
}

main().catch(console.error);
