
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// Verify these environment variables
const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const POSITION_MANAGER_ADDRESS = "0x1238536071E1c9614c21D60d1350862eadc46"; 
const VAULT_ADDRESS = "0x11Ea6777Ff9cC8bc05c0cd54B646D5052ff18899"; // From screenshot/contracts

const PM_ABI = [
    "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
    "function ownerOf(uint256 tokenId) external view returns (address)"
];

async function main() {
    console.log("🚀 Starting NFT Value Check...");
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const pm = new ethers.Contract(POSITION_MANAGER_ADDRESS, PM_ABI, provider);

    // From user screenshot: Minted Token ID [223600]
    const TOKEN_ID = 223600;

    console.log(`🔍 Querying Position #${TOKEN_ID} at ${POSITION_MANAGER_ADDRESS}`);
    console.log(`Using RPC: ${RPC_URL}`);

    try {
        const owner = await pm.ownerOf(TOKEN_ID);
        console.log(`\n👤 Owner: ${owner}`);
        console.log(`   Expected Vault: ${VAULT_ADDRESS}`);
        
        if (owner.toLowerCase() === VAULT_ADDRESS.toLowerCase()) {
            console.log("   ✅ Confirmed: Vault owns this NFT.");
        } else {
             console.log("   ⚠️ Owner mismatch!");
        }

        const pos = await pm.positions(TOKEN_ID);
        console.log(`\n💧 Liquidity: ${pos.liquidity.toString()}`);
        console.log(`📍 Range: [${pos.tickLower}, ${pos.tickUpper}]`);
        
        if (pos.liquidity > 0n) {
             console.log("\n✅ Position is ACTIVE.");
             console.log("   Funds are currently PROVIDING LIQUIDITY in Uniswap V3.");
             console.log("   They are NOT missing.");
        } else {
             console.log("\n❌ Position has 0 liquidity.");
        }

    } catch (e: any) {
        console.error("❌ Error:", e.message || e);
    }
}

main().catch(console.error);
