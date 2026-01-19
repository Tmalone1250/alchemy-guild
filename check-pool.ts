import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Sepolia Addresses
const FACTORY_ADDRESS = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
const SWAP_ROUTER_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const FACTORY_ABI = ["function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"];
const POOL_ABI = [
    "function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
    "function liquidity() external view returns (uint128)",
];
const ERC20_ABI = [
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    let output = "";

    output += `Wallet: ${wallet.address}\n`;
    output += `Router: ${SWAP_ROUTER_ADDRESS}\n`;

    // 1. Check Allowance
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
    const allowance = await weth.allowance(wallet.address, SWAP_ROUTER_ADDRESS);
    output += `WETH Allowance to Router: ${ethers.formatEther(allowance)}\n`;

    // 2. Get Pool
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    const poolAddress = await factory.getPool(WETH_ADDRESS, USDC_ADDRESS, 3000);
    output += `Pool (WETH/USDC 0.3%): ${poolAddress}\n`;

    if (poolAddress === "0x0000000000000000000000000000000000000000") {
        output += "❌ CRITICAL: Pool does not exist!\n";
        fs.writeFileSync("pool-status.txt", output);
        return;
    }

    // 3. Check Pool State
    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
    const liquidity = await pool.liquidity();
    const slot0 = await pool.slot0();

    output += `Liquidity: ${liquidity.toString()}\n`;
    output += `SqrtPriceX96: ${slot0[0].toString()}\n`;
    output += `Tick: ${slot0[1].toString()}\n`;

    if (liquidity === 0n) {
        output += "❌ Pool has ZERO liquidity. Trades will fail.\n";
    } else {
        output += "✅ Pool has liquidity.\n";
    }

    // 4. Check Pool Balances
    const poolWeth = await weth.balanceOf(poolAddress);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    const poolUsdc = await usdc.balanceOf(poolAddress);

    output += `Pool WETH Balance: ${ethers.formatEther(poolWeth)}\n`;
    output += `Pool USDC Balance: ${ethers.formatUnits(poolUsdc, 6)}\n`;

    fs.writeFileSync("pool-status.txt", output);
    console.log("Status written to pool-status.txt");
}

main().catch(console.error);
