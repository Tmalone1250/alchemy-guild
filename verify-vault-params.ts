import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0xEB118d8E3dB55fA1a2764A8A7144905B26680c68";

const VAULT_ABI = [
    "function POSITION_MANAGER() view returns (address)",
    "function SWAP_ROUTER() view returns (address)",
    "function POOL() view returns (address)",
    "function WETH() view returns (address)",
    "function USDC() view returns (address)",
    "function owner() view returns (address)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    console.log("\n🔍 YieldVault Contract Verification");
    console.log(`Vault: ${VAULT_ADDRESS}\n`);

    const positionManager = await vault.POSITION_MANAGER();
    const swapRouter = await vault.SWAP_ROUTER();
    const pool = await vault.POOL();
    const weth = await vault.WETH();
    const usdc = await vault.USDC();
    const owner = await vault.owner();

    console.log("📋 Constructor Parameters:");
    console.log(`Position Manager: ${positionManager}`);
    console.log(`Swap Router:      ${swapRouter}`);
    console.log(`Pool:             ${pool}`);
    console.log(`WETH:             ${weth}`);
    console.log(`USDC:             ${usdc}`);
    console.log(`Owner:            ${owner}\n`);

    console.log("✅ Expected Values:");
    console.log(`Position Manager: 0x1238536071E1c677A632429e3655c799b22cDA52`);
    console.log(`Swap Router:      0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`);
    console.log(`Pool:             0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50`);
    console.log(`WETH:             0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`);
    console.log(`USDC:             0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`);

    console.log("\n🔍 Verification:");
    console.log(`Position Manager: ${positionManager.toLowerCase() === "0x1238536071E1c677A632429e3655c799b22cDA52".toLowerCase() ? "✅" : "❌"}`);
    console.log(`Swap Router:      ${swapRouter.toLowerCase() === "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E".toLowerCase() ? "✅" : "❌"}`);
    console.log(`Pool:             ${pool.toLowerCase() === "0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50".toLowerCase() ? "✅" : "❌"}`);
    console.log(`WETH:             ${weth.toLowerCase() === "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14".toLowerCase() ? "✅" : "❌"}`);
    console.log(`USDC:             ${usdc.toLowerCase() === "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238".toLowerCase() ? "✅" : "❌"}`);
}

main().catch(console.error);
