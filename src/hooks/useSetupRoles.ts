import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { ELEMENT_NFT_ABI } from '@/config/abis';
import { ELEMENT_NFT_ROLES } from '@/lib/roles';

export function useSetupRoles() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const grantBurnerRole = async () => {
    return writeContract({
      address: CONTRACTS.ElementNFT.address,
      abi: ELEMENT_NFT_ABI,
      functionName: 'grantRole',
      args: [
        ELEMENT_NFT_ROLES.BURNER_ROLE,
        CONTRACTS.Alchemist.address,
      ],
    });
  };

  const grantMinterRole = async () => {
    return writeContract({
      address: CONTRACTS.ElementNFT.address,
      abi: ELEMENT_NFT_ABI,
      functionName: 'grantRole',
      args: [
        ELEMENT_NFT_ROLES.MINTER_ROLE,
        CONTRACTS.Alchemist.address,
      ],
    });
  };

  return {
    grantBurnerRole,
    grantMinterRole,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}
