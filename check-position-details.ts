import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0x974EE0295be5524c98D2edE3844bA320911c99eE";
const POSITION_MANAGER = "0x1238536071E1c677A632429e3655c799b22cDA52";

const VAULT_ABI = ["function sLastPositionId() view returns (uint256)"];

const POSITION_MANAGER_ABI = [
    "function positions(uint256) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
    const positionManager = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, provider);

    console.log("\n🔍 Checking Uniswap Position State\n");

    const positionId = await vault.sLastPositionId();
    console.log(`Last Position ID: ${positionId}\n`);

    if (positionId === 0n) {
        console.log("ℹ️  No position created yet");
        return;
    }

    try {
        const position = await positionManager.positions(positionId);

        console.log("📊 Position Details:");
        console.log(`   Nonce:     ${position[0]}`);
        console.log(`   Operator:  ${position[1]}`);
        console.log(`   Token0:    ${position[2]}`);
        console.log(`   Token1:    ${position[3]}`);
        console.log(`   Fee:       ${position[4]}`);
        console.log(`   TickLower: ${position[5]}`);
        console.log(`   TickUpper: ${position[6]}`);
        console.log(`   Liquidity: ${position[7]}\n`);

        const liquidity = position[7];

        if (liquidity === 0n) {
            console.log("⚠️  Position has ZERO liquidity!");
            console.log("   This is unusual after a successful rebalance");
            console.log("   The position NFT exists but has no liquidity");
            console.log("\n   This suggests:");
            console.log("   1. The first rebalance succeeded but didn't mint liquidity");
            console.log("   2. OR the liquidity was already decreased somehow");
        } else {
            console.log(`✅ Position has ${liquidity} liquidity`);
            console.log("   Second rebalance should be able to decrease this");
        }

        console.log(`\n   Tokens Owed 0: ${position[10]}`);
        console.log(`   Tokens Owed 1: ${position[11]}`);

    } catch (error: any) {
        console.log("❌ Error reading position:");
        console.log(`   ${error.message || error}`);
        console.log("\n   The position ID might be invalid");
    }
}

main().catch(console.error);
