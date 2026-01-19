import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const ERC20_ABI = [
    "function deposit() external payable",
    "function balanceOf(address) view returns (uint)"
];

async function main() {
    console.log("--- DEBUG ROUND 2 ---");
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    console.log(`Chain ID: ${network.chainId}`);

    if (network.chainId !== 11155111n) {
        console.warn("⚠️ WARNING: Not connected to Sepolia!");
    } else {
        console.log("✅ Verified Sepolia Network");
    }

    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    console.log(`Wallet: ${wallet.address}`);

    // Check ETH Balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`ETH Balance: ${ethers.formatEther(balance)}`);

    // Check Code at WETH
    const code = await provider.getCode(WETH_ADDRESS);
    console.log(`WETH Code Length: ${code.length}`);
    if (code === '0x') {
        console.error("❌ ERROR: No contract at WETH address!");
        return;
    }

    // Attempt Estimate Gas for Deposit
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, wallet);
    try {
        console.log("Attempting to estimate gas for 0.05 ETH deposit (Matching volume-bot)...");
        const gas = await weth.deposit.estimateGas({ value: ethers.parseEther("0.05") });
        console.log(`✅ Gas Estimate for 0.05 ETH Deposit: ${gas}`);
    } catch (e) {
        console.error("❌ 0.05 ETH Deposit Gas Estimate Failed!", e);
    }
}

main().catch(console.error);
