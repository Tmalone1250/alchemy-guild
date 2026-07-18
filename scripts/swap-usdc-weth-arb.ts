import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, formatEther, parseAbi } from 'viem';
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

const SWAP_AMOUNT_USDC = "10000"; // 10,000 USDC
const POOL_FEE = 3000; // 0.3% fee tier

// ============================================================================
// ABIs
// ============================================================================

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
]);

const SWAP_ROUTER_ABI = parseAbi([
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)',
]);

// ============================================================================
// MAIN SWAP EXECUTION
// ============================================================================

async function main() {
  console.log("=========================================================");
  console.log("🌐 Connecting to Arbitrum Sepolia (421614) via viem...");
  console.log(`Endpoint: ${RPC_URL}`);
  console.log("=========================================================");

  let rawPrivateKey = process.env.PRIVATE_KEY || "";
  if (!rawPrivateKey) {
    throw new Error("❌ PRIVATE_KEY missing in .env environment!");
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

  const chainId = await publicClient.getChainId();
  console.log(`⛓️  Connected to Chain ID: ${chainId} (${arbitrumSepolia.name})`);
  if (chainId !== 421614) {
    throw new Error(`Expected chainId 421614 (Arbitrum Sepolia), got ${chainId}`);
  }

  console.log(`🤖 Deployer Wallet Address: ${account.address}`);

  // Check initial balances
  const ethBalanceBefore = await publicClient.getBalance({ address: account.address });
  const usdcDecimals = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
  }).catch(() => 6);
  const usdcBalanceBefore = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  const wethBalanceBefore = await publicClient.readContract({
    address: WETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  console.log(`\n--- Balances Before Swap ---`);
  console.log(`ETH Balance:  ${formatEther(ethBalanceBefore)} ETH`);
  console.log(`USDC Balance: ${formatUnits(usdcBalanceBefore, usdcDecimals)} USDC`);
  console.log(`WETH Balance: ${formatEther(wethBalanceBefore)} WETH`);

  const amountIn = parseUnits(SWAP_AMOUNT_USDC, usdcDecimals);
  if (usdcBalanceBefore < amountIn) {
    throw new Error(`❌ Insufficient USDC balance! Have ${formatUnits(usdcBalanceBefore, usdcDecimals)} USDC, need ${SWAP_AMOUNT_USDC} USDC.`);
  }

  // 1. Approval Execution
  console.log(`\n--- 🔓 Step 1: Approving ${SWAP_AMOUNT_USDC} USDC for SwapRouter (${SWAP_ROUTER}) ---`);
  const approveTxHash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [SWAP_ROUTER, amountIn],
  });
  console.log(`📡 Broadcasted Approval Tx Hash: ${approveTxHash}`);
  console.log(`⏳ Waiting for approval transaction confirmation...`);
  
  const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
  console.log(`✅ Approval Confirmed in block #${approveReceipt.blockNumber} (Status: ${approveReceipt.status})`);
  if (approveReceipt.status !== 'success') {
    throw new Error("❌ Approval transaction failed on-chain!");
  }

  // 2. Swap Execution (exactInputSingle)
  console.log(`\n--- 🚀 Step 2: Executing exactInputSingle Swap (${SWAP_AMOUNT_USDC} USDC -> WETH) ---`);
  console.log(`Pool Fee Tier: ${POOL_FEE} (0.3%)`);

  const swapParams = {
    tokenIn: USDC_ADDRESS,
    tokenOut: WETH_ADDRESS,
    fee: POOL_FEE,
    recipient: account.address,
    amountIn: amountIn,
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
  console.log(`⏳ Waiting for swap transaction confirmation...`);

  const swapReceipt = await publicClient.waitForTransactionReceipt({ hash: swapTxHash });
  console.log(`✅ Swap Confirmed in block #${swapReceipt.blockNumber} (Status: ${swapReceipt.status}, Gas Used: ${swapReceipt.gasUsed.toString()})`);
  if (swapReceipt.status !== 'success') {
    throw new Error("❌ Swap transaction failed on-chain!");
  }

  // Check balances after swap
  const ethBalanceAfter = await publicClient.getBalance({ address: account.address });
  const usdcBalanceAfter = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  const wethBalanceAfter = await publicClient.readContract({
    address: WETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  console.log(`\n--- Balances After Swap ---`);
  console.log(`ETH Balance:  ${formatEther(ethBalanceAfter)} ETH (${formatEther(ethBalanceAfter - ethBalanceBefore)} ETH change due to gas)`);
  console.log(`USDC Balance: ${formatUnits(usdcBalanceAfter, usdcDecimals)} USDC (-${formatUnits(usdcBalanceBefore - usdcBalanceAfter, usdcDecimals)} USDC spent)`);
  console.log(`WETH Balance: ${formatEther(wethBalanceAfter)} WETH (+${formatEther(wethBalanceAfter - wethBalanceBefore)} WETH received)`);
  console.log("=========================================================");
}

main().catch((err) => {
  console.error("\n❌ Swap Script Error:", err);
  process.exit(1);
});
