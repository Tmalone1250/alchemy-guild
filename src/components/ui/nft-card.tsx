import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { motion } from 'framer-motion';
import { NFT } from '@/types/nft';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { ELEMENT_NFT_ABI } from '@/config/abis';
import { CONTRACTS } from '@/config/contracts';
import { resolveIPFS, fetchMetadata } from '@/utils/ipfs';
import { Loader2 } from 'lucide-react';

interface NFTCardProps {
  nft: NFT;
  variant?: 'inventory' | 'staking' | 'crafting';
  selected?: boolean;
  onAction?: (action: 'stake' | 'unstake' | 'claim' | 'select') => void;
  onSelect?: () => void;
  actionDisabled?: boolean;
  actionText?: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: { trait_type: string; value: string }[];
}

export function NFTCard({ nft, variant = 'inventory', selected, onAction, onSelect, actionDisabled, actionText }: NFTCardProps) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tokenURI from the contract
  const { data: tokenURI } = useReadContract({
    address: CONTRACTS.ElementNFT.address,
    abi: ELEMENT_NFT_ABI as any,
    functionName: 'tokenURI',
    args: [BigInt(nft.tokenId)],
  });

  // Resolve IPFS and fetch metadata JSON
  useEffect(() => {
    if (!tokenURI) return;

    let isMounted = true;
    const getMetadata = async () => {
      setIsLoading(true);
      try {
        const json = await fetchMetadata(tokenURI as string);
        if (isMounted && json) {
          setMetadata(json);
        }
      } catch (error) {
        console.error(`Failed to fetch metadata for token ${nft.tokenId}:`, error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    getMetadata();
    return () => { isMounted = false; };
  }, [tokenURI, nft.tokenId]);

  // Determine styles based on tier
  const isTier3 = nft.tier === 'Gold' || nft.tier === 'Tier 3' || nft.tier === '3';
  const isTier2 = nft.tier === 'Silver' || nft.tier === 'Tier 2' || nft.tier === '2';
  
  const borderClasses = isTier3
    ? 'border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.2)]'
    : isTier2
    ? 'border-slate-300'
    : 'border-zinc-700';

  const weight = isTier3 ? 175 : isTier2 ? 135 : 100;

  // Extract clean variant name
  const variantAttr = metadata?.attributes?.find(attr => attr.trait_type === 'Variant');
  const displayName = variantAttr ? variantAttr.value : (metadata?.name || `Element #${nft.tokenId}`);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
      className={cn(
        'bg-zinc-950 border rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all duration-300',
        borderClasses,
        selected && 'ring-2 ring-primary gold-glow'
      )}
    >
      {/* Element Visual */}
      <div className="relative aspect-square w-full bg-zinc-900 flex items-center justify-center overflow-hidden rounded-t-lg">
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
        ) : metadata?.image ? (
          <img
            src={resolveIPFS(metadata.image)}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-zinc-600 text-sm">No Image</div>
        )}

        {/* Top-Overlay Tier Badge */}
        {!isLoading && (
          <div className={cn(
            "absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-md backdrop-blur-sm",
            isTier3 ? "bg-purple-900/90 text-purple-200 border border-purple-700" :
            isTier2 ? "bg-slate-900/90 text-slate-200 border border-slate-700" :
            "bg-[#8b5a2b]/90 text-orange-100 border border-[#cd7f32]"
          )}>
            {nft.tier}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-grow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">
              {displayName}
            </p>
            {nft.staked && (
              <div className="bg-emerald-900/80 text-emerald-400 border border-emerald-800 text-[10px] px-2 py-0.5 rounded">
                Staked
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">Weight: {weight}</p>
        </div>

        {/* Pending Yield (for staked NFTs) */}
        {nft.staked && nft.pendingYield && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Pending Yield</p>
            <p className="text-lg font-mono text-gold-gradient">
              {nft.pendingYield} <span className="text-xs text-muted-foreground">GOLD</span>
            </p>
          </div>
        )}

        <div className="flex-grow" />

        {/* Actions */}
        {variant === 'staking' && onAction && (
          <div className="flex gap-2 pt-2">
            {nft.staked ? (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1"
                  onClick={(e) => { e.stopPropagation(); onAction('claim'); }}
                >
                  Claim
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => { e.stopPropagation(); onAction('unstake'); }}
                >
                  Unstake
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="default"
                className="w-full"
                disabled={actionDisabled}
                onClick={(e) => { e.stopPropagation(); onAction('stake'); }}
              >
                {actionText || 'Stake'}
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
