import { motion } from 'framer-motion';
import { NFT } from '@/types/nft';
import { ElementIcon } from './element-icon';
import { TierBadge } from './tier-badge';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface NFTCardProps {
  nft: NFT;
  variant?: 'inventory' | 'staking' | 'crafting';
  selected?: boolean;
  onAction?: (action: 'stake' | 'unstake' | 'claim' | 'select') => void;
  onSelect?: () => void;
}

export function NFTCard({ nft, variant = 'inventory', selected, onAction, onSelect }: NFTCardProps) {
  const elementBgClasses: Record<string, string> = {
    // Tier I
    Earth: 'from-element-earth/20 to-element-earth/5',
    Fire: 'from-element-fire/20 to-element-fire/5',
    Water: 'from-element-water/20 to-element-water/5',
    Wind: 'from-element-wind/20 to-element-wind/5',
    Ice: 'from-element-ice/20 to-element-ice/5',
    Lightning: 'from-element-lightning/20 to-element-lightning/5',
    // Tier II
    Plasma: 'from-yellow-400/20 to-yellow-600/5',
    Tornado: 'from-cyan-400/20 to-cyan-600/5',
    Blizzard: 'from-blue-300/20 to-blue-600/5',
    Tsunami: 'from-blue-400/20 to-blue-700/5',
    Quake: 'from-amber-600/20 to-amber-800/5',
    Inferno: 'from-orange-500/20 to-orange-700/5',
    // Tier III
    Holy: 'from-yellow-300/20 to-yellow-500/5',
    Dark: 'from-purple-600/20 to-purple-900/5',
    Gravity: 'from-slate-700/20 to-slate-900/5',
    Time: 'from-indigo-400/20 to-indigo-700/5',
    Bio: 'from-green-500/20 to-green-700/5',
    Spirit: 'from-purple-400/20 to-purple-700/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
      className={cn(
        'glass-panel overflow-hidden cursor-pointer transition-all duration-300',
        selected && 'ring-2 ring-primary gold-glow',
        !selected && 'hover:border-primary/30'
      )}
    >
      {/* Element Visual */}
      <div className={cn(
        'relative h-32 bg-gradient-to-br flex items-center justify-center',
        elementBgClasses[nft.element]
      )}>
        <ElementIcon element={nft.element} size="lg" className="opacity-80" />
        <div className="absolute top-3 right-3">
          <TierBadge tier={nft.tier} size="sm" />
        </div>
        {nft.staked && (
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
            Staked
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{nft.element} Element</p>
            <p className="text-xs text-muted-foreground font-mono">#{nft.tokenId}</p>
          </div>
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
                onClick={(e) => { e.stopPropagation(); onAction('stake'); }}
              >
                Stake
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
