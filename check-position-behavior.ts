import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0xFff8e4da589f15453e73004b65c61Da341B9075C";

const provider = new ethers.JsonRpcProvider(RPC_URL);

const VAULT_ABI = [
    "event Rebalanced(uint256 indexed positionId, uint256 wethCollected, uint256 usdcDistributed, uint256 treasuryTax)"
];

async function main() {
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    console.log("🔍 Position Creation Behavior Check\n");
    console.log("Vault Address:", VAULT_ADDRESS);
    console.log("\nFetching Rebalanced events...\n");

    const filter = vault.filters.Rebalanced();
    const events = await vault.queryFilter(filter);

    if (events.length === 0) {
        console.log("❌ No Rebalanced events found. Has the bot run yet?");
        return;
    }

    console.log(`Found ${events.length} rebalance(s)\n`);

    const positionIds = new Set();

    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const positionId = event.topics[1]; // indexed parameter
        const decodedPositionId = ethers.toBigInt(positionId);

        console.log(`Rebalance #${i + 1}:`);
        console.log(`  Position ID: ${decodedPositionId.toString()}`);
        console.log(`  Block: ${event.blockNumber}`);
        console.log(`  Tx: ${event.transactionHash}\n`);

        positionIds.add(decodedPositionId.toString());
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total Rebalances: ${events.length}`);
    console.log(`Unique Position IDs: ${positionIds.size}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (positionIds.size === 1 && events.length > 1) {
        console.log("✅ CORRECT BEHAVIOR!");
        console.log("   Vault created ONE position and reused it across all rebalances.");
        console.log("   This is the expected behavior after the bug fix.");
    } else if (positionIds.size === events.length) {
        console.log("🚨 BUG DETECTED!");
        console.log("   Vault is creating a NEW position for EVERY rebalance!");
        console.log("   This will cause vault drainage!");
    } else if (positionIds.size === 0 || events.length === 1) {
        console.log("ℹ️  Only one rebalance so far, need more data to verify.");
    } else {
        console.log("⚠️  MIXED BEHAVIOR");
        console.log(`   ${positionIds.size} unique positions across ${events.length} rebalances.`);
    }
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
