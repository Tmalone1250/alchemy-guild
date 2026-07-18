import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
// Use the address from the deployment script/contract
const POOL_ADDRESS = "0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50"; 

const POOL_ABI = [
    "function fee() external view returns (uint24)",
    "function tickSpacing() external view returns (int24)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

    console.log(`\n🔍 Checking Pool Details: ${POOL_ADDRESS}`);

    try {
        const fee = await pool.fee();
        const tickSpacing = await pool.tickSpacing();
        const token0 = await pool.token0();
        const token1 = await pool.token1();

        console.log(`\n📊 Pool Data:`);
        console.log(`   Fee:         ${fee} (${fee == 3000n ? "✅ MATCHES 0.3%" : "❌ MISMATCH (Expected 3000)"})`);
        console.log(`   TickSpacing: ${tickSpacing}`);
        console.log(`   Token0:      ${token0}`);
        console.log(`   Token1:      ${token1}`);

    } catch (error) {
        console.error("❌ Check Failed:", error);
    }
}

main().catch(console.error);
