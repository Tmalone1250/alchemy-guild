import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, formatEther, parseAbi, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// CONFIGURATION & CANONICAL ARBITRUM SEPOLIA ADDRESSES (Chain ID: 421614)
// ============================================================================

const RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc";

const WETH_ADDRESS  = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";
const USDC_ADDRESS  = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const SWAP_ROUTER   = "0x101F443B4d1b059569D643917553c771E1b9663E"; // Uniswap V3 SwapRouter02
const PAYMASTER     = "0xa9924829148A1a1Bd057EAC11B448084cDCbC60a";

const POOL_FEE = 500; // 0.05% fee tier

// ============================================================================
// ABIs
// ============================================================================

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
]);

const PAYMASTER_ABI = parseAbi([
  'function withdrawERC20(address token, address to, uint256 amount) external',
  'function deposit() external payable',
]);

const SWAP_ROUTER_ABI = parseAbi([
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)',
]);

const WETH_ABI = parseAbi([
  'function withdraw(uint256 wad) external',
]);

// ============================================================================
// MAIN RECYCLE EXECUTION
// ============================================================================

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function recycleCycle() {
  let rawPrivateKey = process.env.BOT_PRIVATE_KEY || process.env.PRIVATE_KEY || "";
  if (!rawPrivateKey) {
    throw new Error("❌ PRIVATE_KEY or BOT_PRIVATE_KEY missing in .env environment!");
  }
  if (!rawPrivateKey.startsWith("0x")) {
    rawPrivateKey = "0x" + rawPrivateKey;
  }
  const account = privateKeyToAccount(rawPrivateKey as `0x${string}`);

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(RPC_URL),
  });

  console.log(`🤖 Bot Wallet Address: ${account.address}`);

  // 1. Check USDC Balance in Paymaster
  const paymasterUsdcBalance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [PAYMASTER],
  });

  const minThreshold = parseUnits("0.1", 6); // 0.1 USDC

  if (paymasterUsdcBalance <= minThreshold) {
    console.log(`✅ Paymaster USDC balance (${formatUnits(paymasterUsdcBalance, 6)} USDC) is below threshold. No recycle needed.`);
    return;
  }

  console.log(`\n--- 💸 Step 1: Withdrawing ${formatUnits(paymasterUsdcBalance, 6)} USDC from Paymaster ---`);
  
  const withdrawTxHash = await walletClient.writeContract({
    address: PAYMASTER,
    abi: PAYMASTER_ABI,
    functionName: 'withdrawERC20',
    args: [USDC_ADDRESS, account.address, paymasterUsdcBalance],
  });
  console.log(`📡 Broadcasted Withdraw Tx Hash: ${withdrawTxHash}`);
  await publicClient.waitForTransactionReceipt({ hash: withdrawTxHash });
  console.log(`✅ Withdraw Confirmed!`);

  // 2. Approve SwapRouter to spend USDC
  console.log(`\n--- 🔓 Step 2: Approving SwapRouter for USDC ---`);
  const approveTxHash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [SWAP_ROUTER, paymasterUsdcBalance],
  });
  console.log(`📡 Broadcasted Approval Tx Hash: ${approveTxHash}`);
  await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
  console.log(`✅ Approval Confirmed!`);

  // Record bot's WETH balance before swap
  const wethBalanceBefore = await publicClient.readContract({
    address: WETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  // 3. Swap USDC -> WETH
  console.log(`\n--- 🚀 Step 3: Swapping USDC -> WETH ---`);
  const swapParams = {
    tokenIn: USDC_ADDRESS,
    tokenOut: WETH_ADDRESS,
    fee: POOL_FEE,
    recipient: account.address,
    amountIn: paymasterUsdcBalance,
    amountOutMinimum: 0n,
    sqrtPriceLimitX96: 0n,
  };

  const swapTxHash = await walletClient.writeContract({
    address: SWAP_ROUTER,
    abi: SWAP_ROUTER_ABI,
    functionName: 'exactInputSingle',
    args: [swapParams],
    gas: 500000n,
  });
  console.log(`📡 Broadcasted Swap Tx Hash: ${swapTxHash}`);
  await publicClient.waitForTransactionReceipt({ hash: swapTxHash });
  console.log(`✅ Swap Confirmed!`);

  // Check how much WETH we got
  const wethBalanceAfter = await publicClient.readContract({
    address: WETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  const wethGained = wethBalanceAfter - wethBalanceBefore;
  console.log(`Received: ${formatEther(wethGained)} WETH`);

  if (wethGained <= 0n) {
    throw new Error("❌ Swap resulted in 0 WETH! Aborting.");
  }

  // 4. Unwrap WETH to ETH
  console.log(`\n--- 🔄 Step 4: Unwrapping ${formatEther(wethGained)} WETH to ETH ---`);
  const unwrapTxHash = await walletClient.writeContract({
    address: WETH_ADDRESS,
    abi: WETH_ABI,
    functionName: 'withdraw',
    args: [wethGained],
  });
  console.log(`📡 Broadcasted Unwrap Tx Hash: ${unwrapTxHash}`);
  await publicClient.waitForTransactionReceipt({ hash: unwrapTxHash });
  console.log(`✅ Unwrap Confirmed!`);

  // 5. Deposit to Paymaster
  console.log(`\n--- ⛽ Step 5: Depositing ETH to Paymaster ---`);
  const depositTxHash = await walletClient.writeContract({
    address: PAYMASTER,
    abi: PAYMASTER_ABI,
    functionName: 'deposit',
    value: wethGained,
  });
  console.log(`📡 Broadcasted Deposit Tx Hash: ${depositTxHash}`);
  await publicClient.waitForTransactionReceipt({ hash: depositTxHash });
  console.log(`✅ Deposit Confirmed! Payload successfully recycled.`);
  
  console.log("=========================================================");
  console.log("♻️  Paymaster Recycle Cycle Complete!");
  console.log("=========================================================");
}

async function main() {
  console.log("=========================================================");
  console.log("♻️  Starting Paymaster Tax Recycler Bot...");
  console.log("♻️  Cycle Interval: 30 minutes");
  console.log("=========================================================");

  while (true) {
    try {
      await recycleCycle();
    } catch (err) {
      console.error("\n❌ Recycler Script Error during cycle:", err);
    }
    console.log(`\n💤 Sleeping for 30 minutes...`);
    await sleep(30 * 60 * 1000);
  }
}

main().catch((err) => {
  console.error("\n❌ Fatal Recycler Script Error:", err);
  process.exit(1);
});
