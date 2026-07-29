import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const DISTRIBUTOR_ADDRESS = "0x41aE39A67155ad6cB26531dd293df2d279057f6b";

const DISTRIBUTOR_ABI = [
    "function yieldVault() view returns (address)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const distributor = new ethers.Contract(DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, provider);
    const yv = await distributor.yieldVault();
    console.log(`Distributor yieldVault: ${yv}`);
}

main().catch(console.error);
