import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { CONTRACTS } from "./src/config/contracts";
import { PAYMASTER_ADDRESS } from "./src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY; 
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY || process.env.PRIVATE_KEY; // Fallback to deployer if not set

// Configuration
const FUNDING = {
    PAYMASTER: "1.5",
    VAULT_ETH_FOR_USDC: "1.8",
    VOLUME_BOT: "0.5"
};

const PAYMASTER_ABI = [
    "function setSponsoredContract(address target, bool allowed) external",
    "function deposit() external payable",
    "function withdrawERC20(address token, address to, uint256 amount) external"
];

const ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

    // Setup Bot Wallet
    let botWallet;
    try {
        botWallet = new ethers.Wallet(BOT_PRIVATE_KEY!, provider);
    } catch (e) {
        console.warn("⚠️  Invalid or missing BOT_PRIVATE_KEY, using deployer wallet as bot.");
        botWallet = wallet;
    }

    console.log(`\n🚀 Setup Paymaster & Vault Config`);
    console.log(`Deployer: ${wallet.address}`);
    console.log(`Bot:      ${botWallet.address}`);
    console.log(`Balance:  ${ethers.formatEther(await provider.getBalance(botWallet.address))} ETH`);
    
    // Contracts
    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, wallet);
    // Using known Sepolia Router
    const ROUTER_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
    const swapRouter = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
    const weth = new ethers.Contract(CONTRACTS.WETH.address, ERC20_ABI, wallet);
    const usdc = new ethers.Contract(CONTRACTS.USDC.address, ERC20_ABI, wallet);

    // 1. Whitelist Contracts
    console.log(`\n1️⃣  Whitelisting Contracts...`);
    
    // Whitelist YieldVault
    try {
        console.log(`   Whitelisting YieldVault (${CONTRACTS.YieldVault.address})...`);
        const tx1 = await paymaster.setSponsoredContract(CONTRACTS.YieldVault.address, true);
        await tx1.wait();
        console.log(`   ✅ YieldVault Whitelisted!`);
    } catch (e) {
        console.log(`   ⚠️ YieldVault error: ${e.message}`);
    }

    // Whitelist ElementNFT
    try {
        console.log(`   Whitelisting ElementNFT (${CONTRACTS.ElementNFT.address})...`);
        const tx2 = await paymaster.setSponsoredContract(CONTRACTS.ElementNFT.address, true);
        await tx2.wait();
        console.log(`   ✅ ElementNFT Whitelisted!`);
    } catch (e) {
        console.log(`   ⚠️ ElementNFT error: ${e.message}`);
    }

    // Whitelist Alchemist
    try {
        console.log(`   Whitelisting Alchemist (${CONTRACTS.Alchemist.address})...`);
        const tx3 = await paymaster.setSponsoredContract(CONTRACTS.Alchemist.address, true);
        await tx3.wait();
        console.log(`   ✅ Alchemist Whitelisted!`);
    } catch (e) {
        console.log(`   ⚠️ Alchemist error: ${e.message}`);
    }

    /*
    // 2. Fund Paymaster
    console.log(`\n2️⃣  Funding Paymaster (${FUNDING.PAYMASTER} ETH)...`);
    try {
        const tx = await wallet.sendTransaction({
            to: PAYMASTER_ADDRESS,
            value: ethers.parseEther(FUNDING.PAYMASTER)
        });
        await tx.wait();
        console.log(`   ✅ Funded Paymaster!`);
    } catch (e) {
        console.log(`   ❌ Error funding Paymaster: ${e.message}`);
    }

    // 3. Fund Volume Bot
    if (botWallet.address.toLowerCase() !== wallet.address.toLowerCase()) {
         console.log(`\n3️⃣  Funding Volume Bot (${FUNDING.VOLUME_BOT} ETH)...`);
         try {
             // Check if bot already has funds?
             const botBalance = await provider.getBalance(botWallet.address);
             if (botBalance < ethers.parseEther("0.1")) {
                 const tx = await wallet.sendTransaction({
                     to: botWallet.address,
                     value: ethers.parseEther(FUNDING.VOLUME_BOT)
                 });
                 await tx.wait();
                 console.log(`   ✅ Funded Bot: ${botWallet.address}`);
             } else {
                 console.log(`   ✅ Bot already has funds (${ethers.formatEther(botBalance)} ETH). Skipping.`);
             }
         } catch (e) {
             console.log(`   ❌ Error funding Bot: ${e.message}`);
         }
    } else {
        console.log(`\n3️⃣  Bot is same as Deployer. Skipping separate funding.`);
    }


    // 4. Fund Vault with USDC
    console.log(`\n4️⃣  Swapping ${FUNDING.VAULT_ETH_FOR_USDC} ETH for USDC...`);
    const amountIn = ethers.parseEther(FUNDING.VAULT_ETH_FOR_USDC);

    try {
        // Swap ETH -> WETH -> USDC
        
        // Wrap ETH
        const wethInterface = new ethers.Interface(["function deposit() payable"]);
        const wrapTx = await wallet.sendTransaction({
            to: CONTRACTS.WETH.address,
            value: amountIn,
            data: wethInterface.encodeFunctionData("deposit", [])
        });
        await wrapTx.wait();
        console.log("   ✅ Wrapped ETH");

        // Approve Router
        const approveTx = await weth.approve(ROUTER_ADDRESS, amountIn);
        await approveTx.wait();
        console.log("   ✅ Approved Router");

        // Swap
        const params = {
            tokenIn: CONTRACTS.WETH.address,
            tokenOut: CONTRACTS.USDC.address,
            fee: 3000,
            recipient: wallet.address, // Receive yourself first
            deadline: Math.floor(Date.now() / 1000) + 60 * 10,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        };

        const swapTx = await swapRouter.exactInputSingle(params);
        console.log(`   Swap Tx: ${swapTx.hash}`);
        await swapTx.wait();
        console.log("   ✅ Swapped for USDC");

        // Check Balance
        const usdcBal = await usdc.balanceOf(wallet.address);
        console.log(`   USDC Balance: ${ethers.formatUnits(usdcBal, 6)}`);

        // Send to Vault
        console.log(`\n5️⃣  Sending USDC to Vault...`);
        const sendTx = await usdc.transfer(CONTRACTS.YieldVault.address, usdcBal);
        await sendTx.wait();
        console.log(`   ✅ Sent ${ethers.formatUnits(usdcBal, 6)} USDC to Vault`);

    } catch (e) {
        console.log(`   ❌ Error calling swap/send: ${e.message}`);
    }
    */
    console.log("\n✅ Setup Complete (Whitelisting Only)!");
}


main().catch((error) => {
    console.error(error);
    process.exit(1);
});
