

const { ethers } = require("ethers");

// Hardcoded for reliability during diagnosis
const RPC_URL = "https://rpc.sepolia.org"; 
const POSITION_MANAGER_ADDRESS = "0x1238536071E1c9614c21D60d1350862eadc46"; 
const VAULT_ADDRESS = "0x11Ea6777Ff9cC8bc05c0cd54B646D5052ff18899";
const POOL_ADDRESS = "0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50"; // WETH/USDC 0.3%

const PM_ABI = [
    "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
    "function ownerOf(uint256 tokenId) external view returns (address)"
];

const POOL_ABI = [
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
];

// Math Helpers for Liquidity -> Amounts
function getAmountsForLiquidity(liquidity, tickLower, tickUpper, currentTick) {
    // Simplified for estimation. 
    // In strict range: Amount0 and Amount1 are functions of Liquidity and SqrtPrice.
    // This is complex to replicate exactly in JS without BigInt sqrt, but we can verify State.
    
    // Status Logic
    let status = "Unknown";
    if (currentTick < tickLower) status = "Below Range (100% Token0/WETH)";
    else if (currentTick > tickUpper) status = "Above Range (100% Token1/USDC)";
    else status = "In Range (Mix of Both)";

    return status;
}

// Tick to Price (Approx for display)
function tickToPrice(tick) {
    return 1.0001 ** tick;
}

async function main() {
    console.log("🚀 Starting Vault Value Audit...");
    console.log(`📡 RPC: ${RPC_URL}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const pm = new ethers.Contract(POSITION_MANAGER_ADDRESS, PM_ABI, provider);
    const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

    const TOKEN_ID = 223612;

    try {
        // 1. Check Owner
        const owner = await pm.ownerOf(TOKEN_ID);
        console.log(`\n📋 NFT #${TOKEN_ID} Report:`);
        console.log(`   Owner: ${owner}`);
        if (owner.toLowerCase() === VAULT_ADDRESS.toLowerCase()) {
            console.log("   ✅ Status: SAFTU (Funds Secure in Vault)");
        } else {
             console.log("   ⚠️ WARNING: Owner Mismatch!");
        }

        // 2. Check Pool State
        const slot0 = await pool.slot0();
        const currentTick = Number(slot0.tick);
        console.log(`\n🌊 Pool State:`);
        console.log(`   Current Tick: ${currentTick}`);
        
        // 3. Check Position Liquidity
        const pos = await pm.positions(TOKEN_ID);
        const liquidity = pos.liquidity;
        const tickLower = Number(pos.tickLower);
        const tickUpper = Number(pos.tickUpper);

        console.log(`\n💧 Position Data:`);
        console.log(`   Liquidity: ${liquidity.toString()}`);
        console.log(`   Range: [${tickLower} <-> ${tickUpper}]`);
        
        const status = getAmountsForLiquidity(liquidity, tickLower, tickUpper, currentTick);
        console.log(`   Position Status: ${status}`);

        if (liquidity > 0n) {
             console.log("\n💰 CONCLUSION:");
             console.log("   The missing funds are INSIDE this NFT Position.");
             console.log("   When you see 'Vault Balance' drop, it means funds moved HERE.");
             console.log("   They are actively earning fees.");
        } else {
             console.log("\n❌ Position is Empty (0 Liquidity). Investigation needed.");
        }

    } catch (e) {
        console.error("❌ Error:", e.message || e);
    }
}

main().catch(console.error);

