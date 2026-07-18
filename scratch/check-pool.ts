import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://sepolia.base.org";
const POOL_ADDRESS = "0x46880b404CD35c165EDdefF7421019F8dD25F4Ad";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const pool = new ethers.Contract(POOL_ADDRESS, [
        "function fee() external view returns (uint24)",
        "function token0() external view returns (address)",
        "function token1() external view returns (address)",
        "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationNext, uint16 observationCardinality, uint8 feeProtocol, bool unlocked)"
    ], provider);

    const erc20Abi = [
        "function balanceOf(address) external view returns (uint256)",
        "function symbol() external view returns (string)"
    ];

    const usdc = new ethers.Contract(USDC_ADDRESS, erc20Abi, provider);
    const weth = new ethers.Contract(WETH_ADDRESS, erc20Abi, provider);

    console.log("Querying pool at:", POOL_ADDRESS);
    try {
        const fee = await pool.fee();
        console.log("Fee:", fee);
    } catch (e: any) {
        console.error("Failed to query fee:", e.message || e);
    }

    try {
        const poolUsdc = await usdc.balanceOf(POOL_ADDRESS);
        console.log("Pool USDC Balance:", ethers.formatUnits(poolUsdc, 6));
    } catch (e: any) {
        console.error("Failed to query USDC balance:", e.message || e);
    }

    try {
        const poolWeth = await weth.balanceOf(POOL_ADDRESS);
        console.log("Pool WETH Balance:", ethers.formatEther(poolWeth));
    } catch (e: any) {
        console.error("Failed to query WETH balance:", e.message || e);
    }

    try {
        const slot0 = await pool.slot0();
        console.log("Slot0 tick:", slot0.tick);
        console.log("Slot0 sqrtPriceX96:", slot0.sqrtPriceX96.toString());
    } catch (e: any) {
        console.error("Failed to query slot0:", e.message || e);
    }
}

main().catch(console.error);
