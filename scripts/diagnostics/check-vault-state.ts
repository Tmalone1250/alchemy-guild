import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const VAULT_ADDRESS = CONTRACTS.YieldVault.address;
const PM_ADDRESS = "0x1238536071E1c677A632429e3655c799b22cDA52"; // Sepolia PM (Corrected)

// ABIs
const VAULT_ABI = [
    "function sLastPositionId() view returns (uint256)",
    "function owner() view returns (address)",
    "function sTotalWeight() view returns (uint256)",
    "function sTotalUnclaimedYield() view returns (uint256)"
];

const PM_ABI = [
    "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
];

const ERC20_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)"
];

import * as fs from 'fs';
import * as path from 'path';

// ... (keep headers)

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
    const pm = new ethers.Contract(PM_ADDRESS, PM_ABI, provider);
    
    // Tokens
    const weth = new ethers.Contract(CONTRACTS.WETH.address, ERC20_ABI, provider);
    const usdc = new ethers.Contract(CONTRACTS.USDC.address, ERC20_ABI, provider);

    let output = "";
    const log = (msg: string) => { output += msg + "\n"; console.log(msg); };

    log(`\n🔍 Vault State Diagnostics: ${VAULT_ADDRESS}`);

    try {
        const owner = await vault.owner();
        const lastPosId = await vault.sLastPositionId();
        const totalWeight = await vault.sTotalWeight();
        const unclaimed = await vault.sTotalUnclaimedYield();

        log(`   👑 Owner: ${owner}`);
        log(`   🏷️  Last Position ID: ${lastPosId}`);
        log(`   ⚖️  Total Weight:     ${totalWeight}`);
        log(`   💰 Unclaimed Yield:  ${ethers.formatUnits(unclaimed, 6)} USDC`);

        // Check Position Details
        if (lastPosId > 0n) {
            log(`\n   🧐 querying Position #${lastPosId} on PM...`);
            try {
                const pos = await pm.positions(lastPosId);
                log(`      ✅ Position Found!`);
                log(`      Liquidity: ${pos.liquidity}`);
                log(`      TokensOwed0 (USDC): ${pos.tokensOwed0}`);
                log(`      TokensOwed1 (WETH): ${pos.tokensOwed1}`);
                log(`      Ticks: [${pos.tickLower}, ${pos.tickUpper}]`);
            } catch (e: any) {
                log(`      ❌ Failed to fetch position: ${e.message}`);
                log(`      Using PM Address: ${PM_ADDRESS}`);
            }
        } else {
            log(`\n   ℹ️  No active position (ID is 0).`);
        }

        // Check Allowances
        log(`\n   🔓 Allowances to PositionManager (${PM_ADDRESS}):`);
        const allowUSDC = await usdc.allowance(VAULT_ADDRESS, PM_ADDRESS);
        const allowWETH = await weth.allowance(VAULT_ADDRESS, PM_ADDRESS);
        
        log(`      USDC: ${allowUSDC}`);
        log(`      WETH: ${allowWETH}`);

        // Check Balances
        const balUSDC = await usdc.balanceOf(VAULT_ADDRESS);
        const balWETH = await weth.balanceOf(VAULT_ADDRESS);
        log(`\n   💰 Vault Balances:`);
        log(`      USDC: ${ethers.formatUnits(balUSDC, 6)}`);
        log(`      WETH: ${ethers.formatEther(balWETH)}`);

    } catch (e: any) {
        log(`❌ Diagnostic Failed: ${e.message}`);
    }

    const uploadPath = path.join(process.cwd(), "scripts", "diagnostics", "vault_state.txt");
    fs.writeFileSync(uploadPath, output);
    console.log(`\nWritten to ${uploadPath}`);
}

main().catch(console.error);
