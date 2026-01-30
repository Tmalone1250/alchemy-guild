import { motion } from 'framer-motion';
import { Vault as VaultIcon, ArrowRight, TrendingUp } from 'lucide-react';
import { NFTCard } from '@/components/ui/nft-card';
import { Progress } from '@/components/ui/progress';
import { TIERS } from '@/config/contracts';
import { toast } from 'sonner';
// import { useAccount } from 'wagmi';
import { useYieldVault, useUserNFTs, useApproveNFT, useNFTApproval } from '@/hooks/useContracts';
import { CONTRACTS } from '@/config/contracts';
import { useRef, useState, useEffect } from 'react';

import { useSmartAccount } from '@/hooks/useSmartAccount';

export default function Vault() {
  const { smartAccountAddress } = useSmartAccount();
  const { nfts } = useUserNFTs(smartAccountAddress);
  const { stake, unstake, claimYield, isPending: isVaultPending, isConfirming: isVaultConfirming, isSuccess: isVaultSuccess } = useYieldVault();
  const { approve, setApprovalForAll, isPending: isApprovePending, isConfirming: isApproveConfirming, isSuccess: isApproveSuccess } = useApproveNFT();

  // Check if Vault is approved for all (optimization: check individual if needed, but isApprovedForAll is better UX for multiple stakes)
  // For simplicity in this specific flow, we might just check/approve the specific token or all.
  // Let's use isApprovedForAll to minimize transactions if they stake multiple.
  const { isApprovedForAll } = useNFTApproval(smartAccountAddress || '', CONTRACTS.YieldVault.address);

  // Track pending action for toasts
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const isPending = isVaultPending || isApprovePending;
  const isConfirming = isVaultConfirming || isApproveConfirming;
  const isSuccess = isVaultSuccess || isApproveSuccess;

  const stakedNFTs = nfts.filter((nft) => nft.staked);
  const walletNFTs = nfts.filter((nft) => !nft.staked);

  const totalPendingYield = stakedNFTs.reduce((acc, nft) => {
    return acc + parseFloat(nft.pendingYield || '0');
  }, 0);

  const handleAction = async (action: 'stake' | 'unstake' | 'claim', tokenId: number) => {
    const toastId = `${action}-${tokenId}`; // Unique ID per token action

    try {
      if (action === 'stake') {
        const nft = nfts.find((n) => n.tokenId === tokenId);

        // Check approval if not already approved for all
        if (!isApprovedForAll) {
          const approveId = 'approve-vault';
          setPendingAction(approveId);
          toast.loading(`Please approve the Vault contract first...`, { id: approveId });
          await setApprovalForAll(CONTRACTS.YieldVault.address, true);
          return;
        }

        setPendingAction(toastId);
        toast.loading(`Confirm transaction in your wallet...`, { id: toastId });
        const tierId = TIERS.find((t) => t.name === nft?.tier)?.id || 1;
        await stake(BigInt(tokenId), tierId);
      } else if (action === 'unstake') {
        setPendingAction(toastId);
        toast.loading(`Confirm transaction in your wallet...`, { id: toastId });
        await unstake(BigInt(tokenId));
      } else if (action === 'claim') {
        setPendingAction(toastId);
        toast.loading(`Confirm transaction in your wallet...`, { id: toastId });
        await claimYield(BigInt(tokenId));
      }

      toast.loading(`Processing ${action}...`, { id: toastId });
    } catch (err: any) {
      setPendingAction(null);
      if (err.message?.includes('User rejected')) {
        toast.error('Transaction rejected', { id: toastId });
      } else {
        toast.error('Transaction failed', { id: toastId });
      }
    }
  };

  useEffect(() => {
    if (isSuccess && pendingAction) {
      toast.success('Transaction successful!', { id: pendingAction });
      setPendingAction(null);
    }
  }, [isSuccess, pendingAction]);

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">The Vault</h1>
          <p className="text-muted-foreground mt-1">Stake your Elements and earn yield</p>
        </div>
        <div className="glass-panel px-6 py-4">
          <p className="text-xs text-muted-foreground">Total Pending Yield</p>
          <p className="text-2xl font-mono text-gold-gradient">{totalPendingYield.toFixed(2)} GOLD</p>
        </div>
      </motion.div>

      {/* Tier Weights Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Tier Yield Multipliers</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {TIERS.map((tier) => (
            <div key={tier.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{tier.name}</span>
                <span className="text-sm font-mono text-foreground">{tier.weight}%</span>
              </div>
              <Progress
                value={tier.weight}
                max={175}
                className="h-2"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staked Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <VaultIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Staked Elements</h2>
              <p className="text-sm text-muted-foreground">{stakedNFTs.length} earning yield</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stakedNFTs.map((nft, index) => (
              <motion.div
                key={nft.tokenId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NFTCard
                  nft={nft}
                  variant="staking"
                  onAction={(action) => {
                    if (action !== 'select') {
                      handleAction(action, nft.tokenId);
                    }
                  }}
                />
              </motion.div>
            ))}
          </div>

          {stakedNFTs.length === 0 && (
            <div className="glass-panel p-12 text-center">
              <VaultIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No Elements staked yet</p>
            </div>
          )}
        </motion.div>

        {/* Wallet Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Wallet Elements</h2>
              <p className="text-sm text-muted-foreground">{walletNFTs.length} available to stake</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {walletNFTs.map((nft, index) => (
              <motion.div
                key={nft.tokenId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NFTCard
                  nft={nft}
                  variant="staking"
                  onAction={(action) => {
                    if (action !== 'select') {
                      handleAction(action, nft.tokenId);
                    }
                  }}
                />
              </motion.div>
            ))}
          </div>

          {walletNFTs.length === 0 && (
            <div className="glass-panel p-12 text-center">
              <p className="text-muted-foreground">All Elements are staked!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
