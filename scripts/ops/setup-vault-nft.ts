import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;
const NFT_ADDRESS = CONTRACTS.ElementNFT.address;

const ABI = [
    "function setElementNFT(address _elementNFT) external",
    "function I_ELEMENT_NFT() view returns (address)",
    "function owner() view returns (address)"
];

async function main() {
    if (!BOT_PRIVATE_KEY) {
        console.error("❌ Missing BOT_PRIVATE_KEY in .env");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const botWallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider); 
    const vault = new ethers.Contract(VAULT_ADDRESS, ABI, botWallet);

    console.log(`\n🔧 Configuring Vault: ${VAULT_ADDRESS}`);
    console.log(`   Signer (Bot):    ${botWallet.address}`);
    console.log(`   ElementNFT:      ${NFT_ADDRESS}`);

    try {
        // Double check owner
        const owner = await vault.owner();
        if (owner.toLowerCase() !== botWallet.address.toLowerCase()) {
            console.error(`\n❌ Bot is NOT the owner! Owner is: ${owner}`);
            console.error("   Run 'transfer-to-bot' logic if needed, or use Deployer key.");
            // Determine if deployer owns it
            const DEPLOYER_KEY = process.env.PRIVATE_KEY;
            if (DEPLOYER_KEY) {
                 const deployer = new ethers.Wallet(DEPLOYER_KEY, provider);
                 if (owner.toLowerCase() === deployer.address.toLowerCase()) {
                     console.log("   💡 Deployer IS owner. Using Deployer key...");
                     const vaultDeployer = new ethers.Contract(VAULT_ADDRESS, ABI, deployer);
                     await setNft(vaultDeployer, NFT_ADDRESS);
                     return;
                 }
            }
            return;
        }

        const currentNft = await vault.I_ELEMENT_NFT();
        if (currentNft.toLowerCase() === NFT_ADDRESS.toLowerCase()) {
            console.log("\n✅ Storage already correct. No action needed.");
            return;
        }

        await setNft(vault, NFT_ADDRESS);

    } catch (e: any) {
        console.error("❌ Setup Failed:", e.message);
    }
}

async function setNft(contract: any, address: string) {
    console.log("\n🚀 Sending setElementNFT()...");
    const tx = await contract.setElementNFT(address);
    console.log(`   Tx: ${tx.hash}`);
    await tx.wait();
    console.log("   ✅ Configuration Updated!");
}

main().catch(console.error);
