import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Anvil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useElementNFT } from '@/hooks/useContracts';
import { useAccount } from 'wagmi';

import { useGuildOracle } from '@/hooks/useGuildOracle';

export function MintWidget() {
  const { publicMint, isPending, isConfirming, isSuccess, error } = useElementNFT();
  const { address } = useAccount();
  const { guildBurned } = useGuildOracle();

  const currentPrice = 0.25 + (guildBurned * 0.001);
  const dynamicReward = 1.00 / currentPrice;

  const handleMint = async () => {
    try {
      console.log('MintWidget: Initiating mystery minting process');
      console.log('MintWidget: Connected address:', address);
      // Hardcode arg 0 for the smart contract ABI signature
      const tx = await publicMint(0);
      console.log('MintWidget: Mint transaction submitted/completed:', tx);
    } catch (err: any) {
      console.error('MintWidget: Error caught inside handleMint:', err);
      if (err?.code === 4001 || err?.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user', { id: 'mint' });
      } else {
        const errorMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        toast.error(`Failed to mint NFT: ${errorMsg.slice(0, 80)}`, { id: 'mint' });
      }
    }
  };

  useEffect(() => {
    if (isSuccess) {
      console.log('MintWidget: isSuccess triggered. Successfully minted mystery element');
      toast.success(`Successfully forged a Mystery Element! (+${dynamicReward.toFixed(2)} GUILD Subsidy Granted)`, { id: 'mint' });
    }
  }, [isSuccess, dynamicReward]);

  useEffect(() => {
    if (error) {
      console.error('MintWidget: useElementNFT hook returned error state:', error);
      const errorMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`Transaction failed: ${errorMsg.slice(0, 80)}`, { id: 'mint' });
    }
  }, [error]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Forge Mystery Tier 1 Element</h3>
          <p className="text-sm text-muted-foreground">The Alchemy Forge will yield a random foundational element (Lead Tier). Cost: 0.002 ETH.</p>
        </div>
      </div>

      {/* Governance Subsidy Pill */}
      <div className="mb-5 p-3 rounded-xl border border-primary/30 bg-primary/5 gold-glow flex flex-col gap-2">
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/40 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            + GUILD Subsidy: {dynamicReward.toFixed(2)} GUILD
          </span>
        </div>
      </div>

      {/* Mystery Gacha Display */}
      <div className="flex justify-center mb-6">
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-48 h-48 rounded-xl flex flex-col items-center justify-center gap-4 border-2 border-primary bg-gradient-to-br from-primary/20 to-primary/5 gold-glow"
        >
          <Anvil className="w-16 h-16 text-primary drop-shadow-md" />
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">Mystery Drop</p>
            <p className="text-xs text-muted-foreground">? ? ?</p>
          </div>
        </motion.div>
      </div>

      {/* Mint Button */}
      <Button
        className="w-full"
        size="lg"
        disabled={isPending || isConfirming}
        onClick={handleMint}
      >
        {isPending || isConfirming ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            {isPending ? 'Confirm in wallet...' : 'Forging...'}
          </span>
        ) : (
          'Forge Mystery Element (0.002 ETH)'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-3 animate-pulse">
        ** Please refresh the page after minting to mint another. **
      </p>
    </motion.div>
  );
}
