import { createWalletClient, createPublicClient, http, parseEther, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const GUILD_TOKEN_ADDRESS = '0x39514660f913E651E098c710b03943bA5F451535';
const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

const GUILD_ABI = [
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

async function promptForAddress(): Promise<string> {
  const argAddress = process.argv[2];
  if (argAddress && argAddress.startsWith('0x') && argAddress.length === 42) {
    return argAddress;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\n👉 Enter connected wallet address to receive 1,000 GUILD: ', (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (!trimmed.startsWith('0x') || trimmed.length !== 42) {
        console.error('❌ Invalid Ethereum address provided.');
        process.exit(1);
      }
      resolve(trimmed);
    });
  });
}

async function main() {
  const privateKeyRaw = process.env.BOT_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKeyRaw) {
    console.error('❌ BOT_PRIVATE_KEY or PRIVATE_KEY missing in .env');
    process.exit(1);
  }

  const privateKey = (privateKeyRaw.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(RPC_URL),
  });

  console.log('====================================================');
  console.log('⚗️  ANTIGRAVITY: FUND USER WITH 1,000 GUILD TOKENS');
  console.log('Treasury / Deployer:', account.address);
  console.log('====================================================');

  // Check deployer GUILD balance
  const deployerBal = await publicClient.readContract({
    address: GUILD_TOKEN_ADDRESS,
    abi: GUILD_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  console.log(`Treasury Balance: ${(Number(deployerBal) / 1e18).toLocaleString()} GUILD`);
  if (deployerBal < parseEther('1000')) {
    console.error('❌ Insufficient GUILD in deployer treasury.');
    process.exit(1);
  }

  const userAddressInput = await promptForAddress();
  const recipient = getAddress(userAddressInput);

  console.log(`\n💸 Sending 1,000 GUILD to ${recipient}...`);
  const hash = await walletClient.writeContract({
    address: GUILD_TOKEN_ADDRESS,
    abi: GUILD_ABI,
    functionName: 'transfer',
    args: [recipient, parseEther('1000')],
  });

  console.log('⏳ Waiting for transaction confirmation...');
  console.log(`Tx Hash: https://sepolia.arbiscan.io/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === 'success') {
    const newBal = await publicClient.readContract({
      address: GUILD_TOKEN_ADDRESS,
      abi: GUILD_ABI,
      functionName: 'balanceOf',
      args: [recipient],
    });
    console.log('\n✅ 1,000 GUILD successfully transferred!');
    console.log(`🎉 Recipient New Balance: ${(Number(newBal) / 1e18).toLocaleString()} GUILD`);
    console.log('====================================================');
  } else {
    console.error('\n❌ Transaction failed or reverted on-chain.');
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
