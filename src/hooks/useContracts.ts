import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { sepolia } from 'viem/chains';
import { CONTRACTS } from '@/config/contracts';
import {
  ELEMENT_NFT_ABI,
  ALCHEMIST_CONTRACT_ABI,
  YIELD_VAULT_ABI
} from '@/config/abis';
import { NFT } from '@/types/nft';
import { useMemo, useState } from 'react';
import { useSmartAccount } from './useSmartAccount';
import { encodeFunctionData } from 'viem';

// Simple ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const ELEMENT_NAMES = ['Earth', 'Water', 'Wind', 'Fire', 'Ice', 'Lightning', 'Plasma', 'Tornado', 'Blizzard', 'Tsunami', 'Quake', 'Inferno', 'Holy', 'Dark', 'Gravity', 'Time', 'Bio', 'Spirit'] as const;
const TIER_NAMES = ['Lead', 'Silver', 'Gold'] as const;

export function useElementNFT() {
  const { writeContract, data: hash, isPending: isWagmiPending, error: wagmiError } = useWriteContract();
  const { smartAccountClient, isReady: isSmartAccountReady } = useSmartAccount();
  const [smartAccountHash, setSmartAccountHash] = useState<`0x${string}` | undefined>(undefined);
  const [isSmartAccountPending, setIsSmartAccountPending] = useState(false);
  const [smartAccountError, setSmartAccountError] = useState<Error | null>(null);

  // Determine which hash/status to use
  const activeHash = smartAccountHash || hash;
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: activeHash });

  const publicMint = async (element: number) => {
    // RESET STATE
    setSmartAccountError(null);
    setSmartAccountHash(undefined);
    
    // Try Smart Account first (Gasless)
    if (isSmartAccountReady && smartAccountClient) {
        try {
            setIsSmartAccountPending(true);
            const txHash = await smartAccountClient.writeContract({
                address: CONTRACTS.ElementNFT.address,
                abi: ELEMENT_NFT_ABI,
                functionName: 'publicMint',
                args: [element],
                value: BigInt('2000000000000000'), // 0.002 ETH Protocol Fee
            });
            setSmartAccountHash(txHash);
            return txHash;
        } catch (err: unknown) {
            console.error("Smart Account Mint Failed:", err);
            setSmartAccountError(err as Error);
            throw err;
        } finally {
            setIsSmartAccountPending(false);
        }
    }

    // Fallback to EOA
    return writeContract({
      address: CONTRACTS.ElementNFT.address,
      abi: ELEMENT_NFT_ABI,
      functionName: 'publicMint',
      args: [element],
      value: BigInt('2000000000000000'), // 0.002 ETH
    });
  };

  return {
    publicMint,
    isPending: isWagmiPending || isSmartAccountPending,
    isConfirming,
    isSuccess,
    error: wagmiError || smartAccountError,
    hash: activeHash,
  };
}

export function useApproveNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { smartAccountClient, isReady: isSmartAccountReady } = useSmartAccount();
  const [smartAccountHash, setSmartAccountHash] = useState<`0x${string}` | undefined>(undefined);
  const [isSmartAccountPending, setIsSmartAccountPending] = useState(false);
  const [smartAccountError, setSmartAccountError] = useState<Error | null>(null);

  const activeHash = smartAccountHash || hash;
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: activeHash });

  const approve = async (to: string, tokenId: bigint) => {
    setSmartAccountError(null);
    setSmartAccountHash(undefined);

    if (isSmartAccountReady && smartAccountClient) {
        try {
            setIsSmartAccountPending(true);
            const txHash = await smartAccountClient.writeContract({
                address: CONTRACTS.ElementNFT.address,
                abi: ELEMENT_NFT_ABI,
                functionName: 'approve',
                args: [to, tokenId],
                chain: sepolia,
                account: smartAccountClient.account,
            });
            setSmartAccountHash(txHash);
            return txHash;
        } catch (err: unknown) {
            console.error("Smart Account Approve Failed:", err);
            setSmartAccountError(err as Error);
            throw err;
        } finally {
            setIsSmartAccountPending(false);
        }
    }

    return writeContract({
      address: CONTRACTS.ElementNFT.address,
      abi: ELEMENT_NFT_ABI,
      functionName: 'approve',
      args: [to, tokenId],
    });
  };

  const setApprovalForAll = async (operator: string, approved: boolean) => {
    setSmartAccountError(null);
    setSmartAccountHash(undefined);

    if (isSmartAccountReady && smartAccountClient) {
        try {
            setIsSmartAccountPending(true);
            const txHash = await smartAccountClient.writeContract({
                address: CONTRACTS.ElementNFT.address,
                abi: ELEMENT_NFT_ABI,
                functionName: 'setApprovalForAll',
                args: [operator, approved],
                chain: sepolia,
                account: smartAccountClient.account,
            });
            setSmartAccountHash(txHash);
            return txHash;
        } catch (err: unknown) {
            console.error("Smart Account SetApprovalForAll Failed:", err);
            setSmartAccountError(err as Error);
            throw err;
        } finally {
            setIsSmartAccountPending(false);
        }
    }

    return writeContract({
      address: CONTRACTS.ElementNFT.address,
      abi: ELEMENT_NFT_ABI,
      functionName: 'setApprovalForAll',
      args: [operator, approved],
    });
  };

  return {
    approve,
    setApprovalForAll,
    isPending: isPending || isSmartAccountPending,
    isConfirming,
    isSuccess,
    error: error || smartAccountError,
    hash: activeHash,
  };
}

export function useNFTApproval(owner: string, operator: string) {
  const { data: isApprovedForAll } = useReadContract({
    address: CONTRACTS.ElementNFT.address,
    abi: ELEMENT_NFT_ABI,
    functionName: 'isApprovedForAll',
    args: [owner, operator],
  });

  return {
    isApprovedForAll: isApprovedForAll as boolean,
  };
}

export function useAlchemist() {
  const { writeContract, data: hash, isPending: isWagmiPending, error: wagmiError } = useWriteContract();
  const { smartAccountClient, isReady: isSmartAccountReady } = useSmartAccount();
  const [smartAccountHash, setSmartAccountHash] = useState<`0x${string}` | undefined>(undefined);
  const [isSmartAccountPending, setIsSmartAccountPending] = useState(false);
  const [smartAccountError, setSmartAccountError] = useState<Error | null>(null);

  const activeHash = smartAccountHash || hash;
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: activeHash });

  const craft = async (tokenIds: [bigint, bigint, bigint]) => {
     // RESET STATE
    setSmartAccountError(null);
    setSmartAccountHash(undefined);
    
     if (isSmartAccountReady && smartAccountClient) {
        try {
            setIsSmartAccountPending(true);
            const txHash = await smartAccountClient.writeContract({
                address: CONTRACTS.Alchemist.address,
                abi: ALCHEMIST_CONTRACT_ABI,
                functionName: 'craft',
                args: [tokenIds],
                value: BigInt('2000000000000000'), // 0.002 ETH Protocol Fee
                chain: sepolia,
                account: smartAccountClient.account,
            });
            setSmartAccountHash(txHash);
            return txHash;
        } catch (err: unknown) {
            console.error("Smart Account Craft Failed:", err);
            setSmartAccountError(err as Error);
            throw err;
        } finally {
            setIsSmartAccountPending(false);
        }
    }

    return writeContract({
      address: CONTRACTS.Alchemist.address,
      abi: ALCHEMIST_CONTRACT_ABI,
      functionName: 'craft',
      args: [tokenIds],
      value: BigInt('2000000000000000'), // 0.002 ETH
    });
  };

  return {
    craft,
    isPending: isWagmiPending || isSmartAccountPending,
    isConfirming,
    isSuccess,
    error: wagmiError || smartAccountError,
    hash: activeHash,
  };
}

export function useYieldVault() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { smartAccountClient, isReady: isSmartAccountReady } = useSmartAccount();
  const [smartAccountHash, setSmartAccountHash] = useState<`0x${string}` | undefined>(undefined);
  const [isSmartAccountPending, setIsSmartAccountPending] = useState(false);
  const [smartAccountError, setSmartAccountError] = useState<Error | null>(null);

  const activeHash = smartAccountHash || hash;
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: activeHash });

  const stake = async (tokenId: bigint, tier: number) => {
    setSmartAccountError(null);
    setSmartAccountHash(undefined);

    if (isSmartAccountReady && smartAccountClient) {
        try {
            setIsSmartAccountPending(true);
            const txHash = await smartAccountClient.writeContract({
                address: CONTRACTS.YieldVault.address,
                abi: YIELD_VAULT_ABI,
                functionName: 'stake',
                args: [tokenId, tier],
                value: BigInt(0),
                chain: sepolia,
                account: smartAccountClient.account,
            });
            setSmartAccountHash(txHash);
            return txHash;
        } catch (err: unknown) {
            console.error("Smart Account Stake Failed:", err);
            setSmartAccountError(err as Error);
            throw err;
        } finally {
            setIsSmartAccountPending(false);
        }
    }

    return writeContract({
      address: CONTRACTS.YieldVault.address,
      abi: YIELD_VAULT_ABI,
      functionName: 'stake',
      args: [tokenId, tier],
    });
  };

  const unstake = async (tokenId: bigint) => {
    setSmartAccountError(null);
    setSmartAccountHash(undefined);

    if (isSmartAccountReady && smartAccountClient) {
        try {
            setIsSmartAccountPending(true);
            const txHash = await smartAccountClient.writeContract({
                address: CONTRACTS.YieldVault.address,
                abi: YIELD_VAULT_ABI,
                functionName: 'unstake',
                args: [tokenId],
                value: BigInt(0),
                chain: sepolia,
                account: smartAccountClient.account,
            });
            setSmartAccountHash(txHash);
            return txHash;
        } catch (err: unknown) {
            console.error("Smart Account Unstake Failed:", err);
            setSmartAccountError(err as Error);
            throw err;
        } finally {
            setIsSmartAccountPending(false);
        }
    }

    return writeContract({
      address: CONTRACTS.YieldVault.address,
      abi: YIELD_VAULT_ABI,
      functionName: 'unstake',
      args: [tokenId],
    });
  };

  const claimYield = async (tokenId: bigint) => {
    setSmartAccountError(null);
    setSmartAccountHash(undefined);

    if (isSmartAccountReady && smartAccountClient) {
        try {
            setIsSmartAccountPending(true);
            const txHash = await smartAccountClient.writeContract({
                address: CONTRACTS.YieldVault.address,
                abi: YIELD_VAULT_ABI,
                functionName: 'claimYield',
                args: [tokenId],
                value: BigInt(0),
                chain: sepolia,
                account: smartAccountClient.account,
            });
            setSmartAccountHash(txHash);
            return txHash;
        } catch (err: unknown) {
            console.error("Smart Account Claim Yield Failed:", err);
            setSmartAccountError(err as Error);
            throw err;
        } finally {
            setIsSmartAccountPending(false);
        }
    }

    return writeContract({
      address: CONTRACTS.YieldVault.address,
      abi: YIELD_VAULT_ABI,
      functionName: 'claimYield',
      args: [tokenId],
    });
  };

  return {
    stake,
    unstake,
    claimYield,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useUserNFTs(address?: string) {
  const { data: balance } = useReadContract({
    address: CONTRACTS.ElementNFT.address,
    abi: ELEMENT_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.ElementNFT.address,
    abi: ELEMENT_NFT_ABI,
    functionName: 'totalSupply',
  });

  const balanceNumber = balance ? Number(balance) : 0;

  // Create array of indices for batch reading
  const tokenIndices = useMemo(() => {
    if (!address || balanceNumber === 0) return [];
    return Array.from({ length: balanceNumber }, (_, i) => i);
  }, [address, balanceNumber]);

  // Batch read token IDs
  const tokenIdContracts = useMemo(() => {
    if (!address || tokenIndices.length === 0) return [];
    return tokenIndices.map((index) => ({
      address: CONTRACTS.ElementNFT.address,
      abi: ELEMENT_NFT_ABI,
      functionName: 'tokenOfOwnerByIndex',
      args: [address, BigInt(index)],
    }));
  }, [address, tokenIndices]);

  const { data: tokenIdsData } = useReadContracts({
    contracts: tokenIdContracts as any,
  });

  const tokenIds = useMemo(() => {
    if (!tokenIdsData) return [];
    return tokenIdsData
      .filter((item) => item.status === 'success')
      .map((item) => item.result as bigint);
  }, [tokenIdsData]);

  // Get staked token IDs
  const { data: stakedTokenIds } = useReadContract({
    address: CONTRACTS.YieldVault.address,
    abi: YIELD_VAULT_ABI,
    functionName: 'getUserStakedTokens',
    args: address ? [address] : undefined,
  });

  const stakedTokenSet = useMemo(() => {
    if (!stakedTokenIds) return new Set<string>();
    return new Set((stakedTokenIds as bigint[]).map((id) => id.toString()));
  }, [stakedTokenIds]);

  // Combine wallet and staked token IDs
  const allTokenIds = useMemo(() => {
    const fromWallet = tokenIds || [];
    const fromStaking = stakedTokenIds ? (stakedTokenIds as bigint[]) : [];

    // Create unique set of IDs
    const uniqueIds = new Set([...fromWallet, ...fromStaking].map(id => id.toString()));
    return Array.from(uniqueIds).map(id => BigInt(id));
  }, [tokenIds, stakedTokenIds]);

  // Batch read token details (tier and element)
  const tokenDetailsContracts = useMemo(() => {
    if (allTokenIds.length === 0) return [];
    const contracts: any[] = [];
    allTokenIds.forEach((tokenId) => {
      contracts.push({
        address: CONTRACTS.ElementNFT.address,
        abi: ELEMENT_NFT_ABI,
        functionName: 'getTokenTier',
        args: [tokenId],
      });
      contracts.push({
        address: CONTRACTS.ElementNFT.address,
        abi: ELEMENT_NFT_ABI,
        functionName: 'getTokenElement',
        args: [tokenId],
      });
    });
    return contracts;
  }, [allTokenIds]);

  const { data: tokenDetailsData } = useReadContracts({
    contracts: tokenDetailsContracts as any,
  });

  // Read vault's USDC balance to cap pending rewards
  const { data: vaultUsdcBalance } = useReadContract({
    address: CONTRACTS.USDC.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CONTRACTS.YieldVault.address],
  });

  // Batch read pending rewards for staked tokens
  const pendingRewardContracts = useMemo(() => {
    if (!stakedTokenIds || (stakedTokenIds as bigint[]).length === 0) return [];
    return (stakedTokenIds as bigint[]).map((tokenId) => ({
      address: CONTRACTS.YieldVault.address,
      abi: YIELD_VAULT_ABI,
      functionName: 'getPendingReward',
      args: [tokenId],
    }));
  }, [stakedTokenIds]);

  const { data: pendingRewardsData } = useReadContracts({
    contracts: pendingRewardContracts as any,
  });

  const pendingRewardsMap = useMemo(() => {
    if (!stakedTokenIds || !pendingRewardsData) return new Map<string, string>();

    // Get available USDC balance (same as contract does)
    const availableUsdc = vaultUsdcBalance ? Number(vaultUsdcBalance) / 1e6 : 0;

    const map = new Map<string, string>();
    let totalPendingRewards = 0;

    (stakedTokenIds as bigint[]).forEach((tokenId, index) => {
      const rewardData = pendingRewardsData[index];
      if (rewardData && rewardData.status === 'success') {
        const uncappedReward = Number(rewardData.result as bigint) / 1e6;
        totalPendingRewards += uncappedReward;
      }
    });

    // Now cap each reward proportionally if total exceeds available
    (stakedTokenIds as bigint[]).forEach((tokenId, index) => {
      const rewardData = pendingRewardsData[index];
      if (rewardData && rewardData.status === 'success') {
        let reward = Number(rewardData.result as bigint) / 1e6;

        // Cap at available USDC (same logic as contract)
        if (totalPendingRewards > availableUsdc && availableUsdc > 0) {
          // Scale down proportionally
          reward = (reward / totalPendingRewards) * availableUsdc;
        } else if (reward > availableUsdc) {
          reward = availableUsdc;
        }

        map.set(tokenId.toString(), reward.toFixed(6));
      }
    });
    return map;
  }, [stakedTokenIds, pendingRewardsData, vaultUsdcBalance]);

  const nfts: NFT[] = useMemo(() => {
    if (!tokenDetailsData || allTokenIds.length === 0) return [];

    return allTokenIds.map((tokenId, index) => {
      const tierIndex = index * 2;
      const elementIndex = index * 2 + 1;

      const tierData = tokenDetailsData[tierIndex];
      const elementData = tokenDetailsData[elementIndex];

      if (!tierData || !elementData) {
        return null;
      }

      // Handle potential fetch failures
      if (tierData.status !== 'success' || elementData.status !== 'success') {
        return null;
      }

      const tier = Number(tierData.result as number);
      const element = Number(elementData.result as number);
      const tokenIdStr = tokenId.toString();
      const isStaked = stakedTokenSet.has(tokenIdStr);

      const nft: NFT = {
        tokenId: Number(tokenId),
        element: ELEMENT_NAMES[element] || 'Earth',
        tier: TIER_NAMES[tier - 1] || 'Lead',
        staked: isStaked,
      };

      if (isStaked) {
        nft.pendingYield = pendingRewardsMap.get(tokenIdStr) || '0.00';
        nft.stakedAt = Date.now();
      }

      return nft;
    }).filter((nft): nft is NFT => nft !== null);
  }, [allTokenIds, tokenDetailsData, stakedTokenSet, pendingRewardsMap]);

  return {
    balance: balanceNumber,
    totalSupply: totalSupply ? Number(totalSupply) : 0,
    nfts,
    isLoading: !tokenIdsData || !tokenDetailsData,
  };
}

export function usePendingReward(tokenId?: bigint) {
  const { data: pendingReward } = useReadContract({
    address: CONTRACTS.YieldVault.address,
    abi: YIELD_VAULT_ABI,
    functionName: 'getPendingReward',
    args: tokenId !== undefined ? [tokenId] : undefined,
  });

  return {
    pendingReward: pendingReward ? pendingReward.toString() : '0',
  };
}

export function useStakedTokens(address?: string) {
  const { data: stakedTokens } = useReadContract({
    address: CONTRACTS.YieldVault.address,
    abi: YIELD_VAULT_ABI,
    functionName: 'getUserStakedTokens',
    args: address ? [address] : undefined,
  });

  return {
    stakedTokens: stakedTokens as bigint[] | undefined,
  };
}
