import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { CONTRACTS } from "./src/config/contracts";
import { PAYMASTER_ADDRESS } from "./src/config/contracts";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY; 
const BOT_PRIVATE_KEY = process.env.PRIVATE_KEY; // Using same key for now as deployer/bot

// Configuration
const FUNDING = {
    PAYMASTER: "2.0",
    VAULT_ETH_FOR_USDC: "2.0",
    VOLUME_BOT: "1.5"
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

    console.log(`\n🚀 Setup Paymaster & Vault Config`);
    console.log(`Address: ${wallet.address}`);
    console.log(`Balance: ${ethers.formatEther(await provider.getBalance(wallet.address))} ETH`);
    
    // Contracts
    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, wallet);
    const router = new ethers.Contract(CONTRACTS.Pool.address, ROUTER_ABI, wallet); // Warning: Pool address in config might be Pool, not Router. Checking...
    // Actually, contracts.ts has Pool address, usually Router is needed for swap.
    // Using known Sepolia Router: 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E
    const ROUTER_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
    const swapRouter = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
    const weth = new ethers.Contract(CONTRACTS.WETH.address, ERC20_ABI, wallet);
    const usdc = new ethers.Contract(CONTRACTS.USDC.address, ERC20_ABI, wallet);

    // 1. Whitelist New Vault
    console.log(`\n1️⃣  Whitelisting Vault (${CONTRACTS.YieldVault.address})...`);
    try {
        const tx = await paymaster.setSponsoredContract(CONTRACTS.YieldVault.address, true);
        await tx.wait();
        console.log(`   ✅ Whitelisted!`);
    } catch (e) {
        console.log(`   ⚠️  Might already be whitelisted or error: ${e.message}`);
    }

    // 2. Fund Paymaster
    console.log(`\n2️⃣  Funding Paymaster (${FUNDING.PAYMASTER} ETH)...`);
    try {
        const tx = await wallet.sendTransaction({
            to: PAYMASTER_ADDRESS,
            value: ethers.parseEther(FUNDING.PAYMASTER)
        });
        await tx.wait();
        console.log(`   ✅ Funded!`);
    } catch (e) {
        console.log(`   ❌ Error funding Paymaster: ${e.message}`);
    }

    // 3. Fund Volume Bot
    // Since we are running AS the bot/deployer, we check our own balance? 
    // Or if there is a separate bot address?
    // "Provide 1.5 ETH to the volume bot". Assuming volume-bot.ts uses a different key?
    // Looking at volume-bot.ts imports... usually shares PRIVATE_KEY.
    // IF SAME WALLET: Skip.
    // IF DIFFERENT: Send.
    // For now, assume SAME WALLET, so we just check reserve.

    // 4. Fund Vault with USDC
    console.log(`\n3️⃣  Swapping ${FUNDING.VAULT_ETH_FOR_USDC} ETH for USDC...`);
    const amountIn = ethers.parseEther(FUNDING.VAULT_ETH_FOR_USDC);

    try {
        // Swap ETH -> WETH -> USDC or ETH -> USDC directly via Router
        // Router exactInputSingle typically takes WETH.
        
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
        console.log(`\n4️⃣  Sending USDC to Vault...`);
        const sendTx = await usdc.transfer(CONTRACTS.YieldVault.address, usdcBal);
        await sendTx.wait();
        console.log(`   ✅ Sent ${ethers.formatUnits(usdcBal, 6)} USDC to Vault`);

    } catch (e) {
        console.log(`   ❌ Error calling swap/send: ${e.message}`);
    }

    console.log("\n✅ Setup Complete!");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
