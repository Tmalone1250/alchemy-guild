import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { CONTRACTS, PAYMASTER_ADDRESS } from "./src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Minimal ABIs
const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
];

const VAULT_ABI = [
    "event Rebalanced(uint256 indexed positionId, uint256 wethCollected, uint256 usdcDistributed, uint256 treasuryTax)",
    "function PAYMASTER() external view returns (address)",
    "function USDC() external view returns (address)"
];

async function main() {
    if (!RPC_URL) throw new Error("Missing VITE_INFURA_RPC_URL");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    let logBuffer = "";
    const log = (msg: string) => {
        console.log(msg);
        logBuffer += msg + "\n";
    };

    log("🔍 Checking Paymaster Tax Status...");
    log(`YieldVault Address (Config): ${CONTRACTS.YieldVault.address}`);

    const vault = new ethers.Contract(CONTRACTS.YieldVault.address, VAULT_ABI, provider);
    
    // Fetch actual dependencies from Vault
    const onChainPaymaster = await vault.PAYMASTER();
    const onChainUSDC = await vault.USDC();

    log(`YieldVault.PAYMASTER(): ${onChainPaymaster}`);
    log(`YieldVault.USDC():      ${onChainUSDC}`);
    
    if (onChainPaymaster.toLowerCase() !== PAYMASTER_ADDRESS.toLowerCase()) {
        log(`⚠️ WARNING: Configured Paymaster (${PAYMASTER_ADDRESS}) matches on-chain? NO!`);
        log(`Create check for ACTUAL paymaster (${onChainPaymaster})...`);
    } else {
        log(`✅ Config matches on-chain Paymaster.`);
    }

    // 1. Check Paymaster USDC Balance (Using the one Vault sends to)
    const usdc = new ethers.Contract(onChainUSDC, ERC20_ABI, provider);
    const balance = await usdc.balanceOf(onChainPaymaster);
    const decimals = await usdc.decimals();
    const formattedBalance = ethers.formatUnits(balance, decimals);

    log(`\n💰 Paymaster USDC Balance: ${formattedBalance} USDC`);

    // 2. Check YieldVault Rebalance Events
    // vault is already instantiated above
    
    // Scan from deployment block (approx) or just recent history
    // Sepolia block time is fast, let's scan last 100,000 blocks to be safe or since a known block
    // contracts.ts says DEPLOYMENT_BLOCK = 10000000n;
    // Defaulting to a wide range
    const filter = vault.filters.Rebalanced();
    const events = await vault.queryFilter(filter, -50000); // Last 50k blocks

    log(`\n📜 Found ${events.length} Rebalance Events in last 50k blocks:`);

    let totalTaxEmitted = 0n;

    events.forEach((event: any) => {
        const { transactionHash, args } = event;
        const tax = args.treasuryTax;
        const usdcDist = args.usdcDistributed;
        
        log(`- Tx: ${transactionHash.slice(0, 8)}... | Tax: ${ethers.formatUnits(tax, decimals)} USDC | Yield: ${ethers.formatUnits(usdcDist, decimals)} USDC`);
        
        totalTaxEmitted += tax;
    });

    log(`\n∑ Total Tax Emitted (Last 50k blocks): ${ethers.formatUnits(totalTaxEmitted, decimals)} USDC`);

    // Conclusion
    if (balance >= totalTaxEmitted && totalTaxEmitted > 0n) {
        log("\n✅ VERIFIED: Paymaster holds sufficient USDC to cover emitted tax.");
    } else if (totalTaxEmitted === 0n) {
        log("\n⚠️ No tax events found. The Vault may not have successfully rebalanced yet.");
    } else {
        log("\n⚠️ MISMATCH: Paymaster balance is less than total emitted tax (Paymaster might have spent funds or checks failed).");
    }

    fs.writeFileSync("rebalance_report.txt", logBuffer, "utf8");
}

main().catch(console.error);
