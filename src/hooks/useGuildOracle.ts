import { useReadContracts } from 'wagmi';
import {
  GUILD_TOKEN_ADDRESS,
  CONTRACTS,
  USDC_ADDRESS,
  WETH_ADDRESS
} from '@/config/contracts';
import { GUILD_TOKEN_ABI } from '@/config/abis';

const POOL_ADDRESS = '0x66EEAB70aC52459Dd74C6AD50D578Ef76a441bbf' as const;

const poolAbi = [
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
      { internalType: 'int24', name: 'tick', type: 'int24' },
      { internalType: 'uint16', name: 'observationIndex', type: 'uint16' },
      { internalType: 'uint16', name: 'observationCardinality', type: 'uint16' },
      { internalType: 'uint16', name: 'observationCardinalityNext', type: 'uint16' },
      { internalType: 'uint8', name: 'feeProtocol', type: 'uint8' },
      { internalType: 'bool', name: 'unlocked', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export function useGuildOracle() {
  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: [
      {
        address: POOL_ADDRESS,
        abi: poolAbi,
        functionName: 'slot0',
      },
      {
        address: GUILD_TOKEN_ADDRESS,
        abi: GUILD_TOKEN_ABI,
        functionName: 'totalSupply',
      },
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [CONTRACTS.Treasury.address],
      },
      {
        address: WETH_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [CONTRACTS.Treasury.address],
      }
    ] as const,
  });

  const slot0Result = data?.[0];
  const totalSupplyResult = data?.[1];
  const usdcBalanceResult = data?.[2];
  const wethBalanceResult = data?.[3];

  let guildPerWeth = 0;
  if (slot0Result && slot0Result.status === 'success' && slot0Result.result) {
    const sqrtPriceX96 = slot0Result.result[0];
    // Math for the Hook:
    // 1. Fetch sqrtPriceX96 from slot0
    // 2. priceRatio = Number(sqrtPriceX96) / Math.pow(2, 96)
    // 3. rawPrice = Math.pow(priceRatio, 2)
    // 4. guildPerWeth = 1 / rawPrice
    const priceRatio = Number(sqrtPriceX96) / Math.pow(2, 96);
    const rawPrice = Math.pow(priceRatio, 2);
    guildPerWeth = rawPrice > 0 ? 1 / rawPrice : 0;
  }

  const initialSupply = 100_000_000n; // 100M initial GUILD
  let guildBurned = 0;
  if (totalSupplyResult && totalSupplyResult.status === 'success' && totalSupplyResult.result !== undefined) {
    const currentSupply = BigInt(totalSupplyResult.result);
    const initialSupplyWei = initialSupply * 10n ** 18n;
    if (initialSupplyWei > currentSupply) {
      guildBurned = Number(initialSupplyWei - currentSupply) / 1e18;
    }
  }

  const usdcDepth = usdcBalanceResult && usdcBalanceResult.status === 'success' && usdcBalanceResult.result !== undefined 
    ? Number(usdcBalanceResult.result) / 1e6 
    : 0;
    
  const wethDepth = wethBalanceResult && wethBalanceResult.status === 'success' && wethBalanceResult.result !== undefined 
    ? Number(wethBalanceResult.result) / 1e18 
    : 0;

  return {
    guildPerWeth,
    guildBurned,
    usdcDepth,
    wethDepth,
    isLoading,
    isError,
    refetch,
  };
}
