import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

    const ethBalance = await provider.getBalance(wallet.address);
    const wethBalance = await weth.balanceOf(wallet.address);
    const usdcBalance = await usdc.balanceOf(wallet.address);

    console.log("\n💰 Bot Wallet Balances");
    console.log(`Wallet: ${wallet.address}\n`);
    console.log(`ETH:  ${ethers.formatEther(ethBalance)}`);
    console.log(`WETH: ${ethers.formatEther(wethBalance)}`);
    console.log(`USDC: ${ethers.formatUnits(usdcBalance, 6)}\n`);

    const needWeth = ethers.parseEther("0.02");
    const needUsdc = 10000000n; // 10 USDC

    console.log("📝 Required for vault seeding:");
    console.log(`WETH: 0.02 (${wethBalance >= needWeth ? "✅" : "❌"})`);
    console.log(`USDC: 10.0  (${usdcBalance >= needUsdc ? "✅" : "❌"})\n`);

    if (wethBalance < needWeth) {
        console.log("❌ Not enough WETH!");
        if (ethBalance > ethers.parseEther("0.05")) {
            console.log("   BUT you have ETH - you can wrap it to WETH!");
            console.log("   Run: npx tsx wrap-eth.ts");
        } else {
            console.log("   You need to get some Sepolia ETH first");
            console.log("   Faucet: https://sepoliafaucet.com/");
        }
    }

    if (usdcBalance < needUsdc) {
        console.log("❌ Not enough USDC!");
        console.log("   Get testnet USDC from: https://faucet.circle.com/");
        console.log("   Or use a Sepolia testnet USDC faucet");
    }
}

main().catch(console.error);
