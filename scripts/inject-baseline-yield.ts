import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;

if (!BOT_PRIVATE_KEY) {
    console.error("❌ BOT_PRIVATE_KEY is missing from environment.");
    process.exit(1);
}

const WETH_ADDRESS = ethers.getAddress("0x980B62Da83eFf3D4576C647993b0c1D7faf17c73".toLowerCase());
const USDC_ADDRESS = ethers.getAddress("0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d".toLowerCase());
const GUILD_DISTRIBUTOR_ADDRESS = ethers.getAddress("0xDf90762ccF9a199Ca8872C18E4f9C5DE42f2773e".toLowerCase());

const WETH_ABI = [
    "function deposit() external payable",
    "function balanceOf(address account) external view returns (uint256)"
];

const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
];

const DISTRIBUTOR_ABI = [
    "function notifyRewardAmount(uint256 amount) external",
    "function rewardPerWeightPool1() external view returns (uint256)",
    "function unallocatedUsdc() external view returns (uint256)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY!, provider);

    console.log(`🤖 Operating with Wallet: ${wallet.address}`);

    // 1. Wrap 1.0 ETH into WETH
    const nativeBal: bigint = await provider.getBalance(wallet.address);
    console.log(`💰 Native ETH Balance: ${ethers.formatEther(nativeBal)} ETH`);

    const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, wallet);

    if (nativeBal >= ethers.parseEther("1.01")) {
        console.log(`⏳ Wrapping 1.0 ETH into WETH for bot trading runway...`);
        const txWrap = await wethContract.deposit({ value: ethers.parseEther("1.0") });
        await txWrap.wait();
        console.log(`✅ Wrapped 1.0 ETH successfully: ${txWrap.hash}`);
    } else {
        console.log(`⚠️ Native ETH balance low, skipping WETH wrap.`);
    }

    const wethBal: bigint = await wethContract.balanceOf(wallet.address);
    console.log(`☕ Bot WETH Balance: ${ethers.formatEther(wethBal)} WETH`);

    // 2. Check USDC Balance & Inject 5,000 USDC
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    const distributor = new ethers.Contract(GUILD_DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, wallet);

    const usdcBal: bigint = await usdc.balanceOf(wallet.address);
    console.log(`💵 Bot USDC Balance: ${Number(usdcBal) / 1e6} USDC (${usdcBal.toString()} raw units)`);

    const target5000 = 5000n * 10n ** 6n;
    let injectionAmountUnits = usdcBal >= target5000 ? target5000 : usdcBal;

    console.log(`🎯 Injecting Amount: ${Number(injectionAmountUnits) / 1e6} USDC into ${GUILD_DISTRIBUTOR_ADDRESS}`);

    // Approve
    console.log(`🔑 Approving USDC spend for GuildDistributor...`);
    const txApprove = await usdc.approve(GUILD_DISTRIBUTOR_ADDRESS, injectionAmountUnits);
    await txApprove.wait();
    console.log(`✅ Approval Tx Confirmed: ${txApprove.hash}`);

    // Notify Reward
    console.log(`🚀 Executing notifyRewardAmount(${injectionAmountUnits.toString()})...`);
    const txNotify = await distributor.notifyRewardAmount(injectionAmountUnits);
    const receipt = await txNotify.wait();
    console.log(`🎉 notifyRewardAmount Tx Confirmed: ${receipt.hash}`);

    // Verify unallocated or active pool weight
    const unallocated: bigint = await distributor.unallocatedUsdc();
    const pool1Weight: bigint = await distributor.rewardPerWeightPool1();
    console.log(`📊 GuildDistributor Unallocated USDC: ${Number(unallocated) / 1e6} USDC`);
    console.log(`📈 rewardPerWeightPool1: ${pool1Weight.toString()}`);
    console.log(`✨ Capital Wrap & Baseline Yield Injection Complete!`);
}

main().catch((err) => {
    console.error("❌ Execution Failed:", err);
    process.exit(1);
});
