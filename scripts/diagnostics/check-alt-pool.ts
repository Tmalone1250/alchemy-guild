import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS } from "../../src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || "https://rpc.sepolia.org";
const FACTORY_ADDRESS = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c"; // Uniswap V3 Factory (Sepolia)
const USDC = CONTRACTS.USDC.address;
const WETH = CONTRACTS.WETH.address;

const FACTORY_ABI = ["function getPool(address, address, uint24) view returns (address)"];
const POOL_ABI = ["function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

    console.log("🔍 Check Alternative Pool (Fee 500 / 0.05%)");
    
    try {
        const poolAddress = await factory.getPool(USDC, WETH, 500);
        console.log(`Pool Address: ${poolAddress}`);

        if (poolAddress === ethers.ZeroAddress) {
            console.log("❌ Pool does not exist.");
            return;
        }

        const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
        const slot0 = await pool.slot0();
        const tick = slot0[1];
        
        console.log(`Current Tick: ${tick}`);
        
        // Approximate Price Calculation (1.0001^tick)
        // Since token0=USDC (0x1c) and token1=WETH (0xfF), Price = WETH/USDC? 
        // No, Price = token1/token0. 
        // WETH/USDC means "Amount of USDC per 1 WETH" if USDC is token0?
        // token0 = 6 decimals. token1 = 18 decimals.
        // realPrice = (1.0001^tick) * (10^12) ?
        // Let's just judge by the tick value.
        // Expected ~ -200,000 or -78,000 depending on order.
        
        // If Tick is ~184,000 -> Bad.
        // If Tick is ~200,000 -> Bad.
        // Reasonable range for USDC/WETH matches ~2000 price.
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}

main().catch(console.error);
