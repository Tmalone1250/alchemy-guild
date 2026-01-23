import { useState } from 'react';
import { motion } from 'framer-motion';
import { Grid3X3, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFTCard } from '@/components/ui/nft-card';
import { ElementType, TierType, ELEMENTS, TIERS } from '@/config/contracts';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useUserNFTs } from '@/hooks/useContracts';

export default function Inventory() {
  const { address } = useAccount();
  const { balance, nfts, isLoading } = useUserNFTs(address);
  const [filterElement, setFilterElement] = useState<ElementType | null>(null);
  const [filterTier, setFilterTier] = useState<TierType | null>(null);

  const filteredNFTs = nfts.filter((nft) => {
    if (filterElement && nft.element !== filterElement) return false;
    if (filterTier && nft.tier !== filterTier) return false;
    return true;
  });

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Your collection of Element NFTs</p>
        </div>
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-mono">
            {balance} NFTs owned
          </span>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filters:</span>
          </div>

          {/* Element Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Element:</span>
            <Button
              size="sm"
              variant={filterElement === null ? 'default' : 'outline'}
              onClick={() => setFilterElement(null)}
            >
              All
            </Button>
            {ELEMENTS.map((el) => (
              <Button
                key={el.id}
                size="sm"
                variant={filterElement === el.name ? 'default' : 'outline'}
                onClick={() => setFilterElement(el.name)}
              >
                {el.name}
              </Button>
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Tier Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Tier:</span>
            <Button
              size="sm"
              variant={filterTier === null ? 'default' : 'outline'}
              onClick={() => setFilterTier(null)}
            >
              All
            </Button>
            {TIERS.map((tier) => (
              <Button
                key={tier.id}
                size="sm"
                variant={filterTier === tier.name ? 'default' : 'outline'}
                onClick={() => setFilterTier(tier.name)}
                className={cn(
                  filterTier === tier.name && tier.name === 'Gold' && 'bg-gold-gradient text-primary-foreground'
                )}
              >
                {tier.name}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* NFT Grid */}
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-panel h-64 animate-pulse" />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {filteredNFTs.map((nft, index) => (
            <motion.div
              key={nft.tokenId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NFTCard nft={nft} variant="inventory" />
            </motion.div>
          ))}
        </motion.div>
      )}

      {!isLoading && filteredNFTs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-muted-foreground">No NFTs match your filters</p>
        </motion.div>
      )}
    </div>
  );
}
