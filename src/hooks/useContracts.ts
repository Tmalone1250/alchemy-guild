import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { 
  ELEMENT_NFT_ABI, 
  ALCHEMIST_CONTRACT_ABI, 
  YIELD_VAULT_ABI 
} from '@/config/abis';
import { NFT } from '@/types/nft';
import { useMemo } from 'react';

const ELEMENT_NAMES = ['Earth', 'Water', 'Wind', 'Fire', 'Ice', 'Lightning'] as const;
const TIER_NAMES = ['Lead', 'Silver', 'Gold'] as const;

export function useElementNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const publicMint = async (element: number) => {
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
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useAlchemist() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const craft = async (tokenIds: [bigint, bigint, bigint]) => {
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
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useYieldVault() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const stake = async (tokenId: bigint, tier: number) => {
    return writeContract({
      address: CONTRACTS.YieldVault.address,
      abi: YIELD_VAULT_ABI,
      functionName: 'stake',
      args: [tokenId, tier],
    });
  };

  const unstake = async (tokenId: bigint) => {
    return writeContract({
      address: CONTRACTS.YieldVault.address,
      abi: YIELD_VAULT_ABI,
      functionName: 'unstake',
      args: [tokenId],
    });
  };

  const claimYield = async (tokenId: bigint) => {
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

  // Batch read token details (tier and element)
  const tokenDetailsContracts = useMemo(() => {
    if (tokenIds.length === 0) return [];
    const contracts: any[] = [];
    tokenIds.forEach((tokenId) => {
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
  }, [tokenIds]);

  const { data: tokenDetailsData } = useReadContracts({
    contracts: tokenDetailsContracts as any,
  });

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
    const map = new Map<string, string>();
    (stakedTokenIds as bigint[]).forEach((tokenId, index) => {
      const rewardData = pendingRewardsData[index];
      if (rewardData && rewardData.status === 'success') {
        const reward = rewardData.result as bigint;
        // Convert from wei to USDC (6 decimals)
        map.set(tokenId.toString(), (Number(reward) / 1e6).toFixed(2));
      }
    });
    return map;
  }, [stakedTokenIds, pendingRewardsData]);

  const nfts: NFT[] = useMemo(() => {
    if (!tokenDetailsData || tokenIds.length === 0) return [];

    return tokenIds.map((tokenId, index) => {
      const tierIndex = index * 2;
      const elementIndex = index * 2 + 1;

      const tierData = tokenDetailsData[tierIndex];
      const elementData = tokenDetailsData[elementIndex];

      if (!tierData || tierData.status !== 'success' || !elementData || elementData.status !== 'success') {
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
  }, [tokenIds, tokenDetailsData, stakedTokenSet, pendingRewardsMap]);

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
