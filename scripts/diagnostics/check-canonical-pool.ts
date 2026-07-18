import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const FACTORY_ADDRESS = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c"; // Uniswap V3 Factory (Sepolia)
const USDC = CONTRACTS.USDC.address;
const WETH = CONTRACTS.WETH.address;
const FEE = 3000;

// The address currently used by YieldVault
const USED_POOL_ADDRESS = "0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50";

const FACTORY_ABI = ["function getPool(address, address, uint24) view returns (address)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

    console.log(`\n🔍 Checking Canonical Pool for USDC/WETH (Fee ${FEE})`);

    try {
        const canonicalPool = await factory.getPool(USDC, WETH, FEE);
        console.log(`   Canonical Pool: ${canonicalPool}`);
        console.log(`   Used Pool:      ${USED_POOL_ADDRESS}`);

        if (canonicalPool.toLowerCase() === USED_POOL_ADDRESS.toLowerCase()) {
            console.log("\n✅ MATCH! The Vault is using the correct pool.");
        } else {
            console.log("\n❌ MISMATCH! The Vault is reading ticks from the WRONG pool.");
            console.log("   This explains the revert! PositionManager uses the Canonical Pool.");
            console.log("   YieldVault calculates ticks from a Ghost Pool.");
        }

    } catch (e) {
        console.error("❌ Check Failed:", e);
    }
}

main().catch(console.error);
