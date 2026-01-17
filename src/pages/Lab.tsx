import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Plus, Sparkles, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFTCard } from '@/components/ui/nft-card';
import { ElementIcon } from '@/components/ui/element-icon';
import { mockNFTs } from '@/data/mockData';
import { CRAFT_FEE } from '@/config/contracts';
import { NFT } from '@/types/nft';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Lab() {
  const [selectedSlots, setSelectedSlots] = useState<(NFT | null)[]>([null, null, null]);
  const [showSelector, setShowSelector] = useState<number | null>(null);
  const [isCrafting, setIsCrafting] = useState(false);

  const availableNFTs = mockNFTs.filter(
    (nft) => !nft.staked && !selectedSlots.some((slot) => slot?.tokenId === nft.tokenId)
  );

  const canCraft = selectedSlots.every((slot) => slot !== null);

  const handleSelectNFT = (slotIndex: number, nft: NFT) => {
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = nft;
    setSelectedSlots(newSlots);
    setShowSelector(null);
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = null;
    setSelectedSlots(newSlots);
  };

  const handleCraft = async () => {
    if (!canCraft) return;

    setIsCrafting(true);
    toast.loading('Transmuting Elements...', { id: 'craft' });

    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 3000));

    toast.success('Transmutation complete! New Silver Element created!', { id: 'craft' });
    setIsCrafting(false);
    setSelectedSlots([null, null, null]);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">The Lab</h1>
        <p className="text-muted-foreground mt-1">Combine three Elements to craft a higher-tier NFT</p>
      </motion.div>

      {/* Synthesis Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Synthesis Table</h2>
            <p className="text-sm text-muted-foreground">Drag or click to add Elements to the slots</p>
          </div>
        </div>

        {/* Crafting Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* Input Slots */}
          <div className="flex items-center gap-4">
            {selectedSlots.map((slot, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {slot ? (
                  <div className="relative">
                    <div className="w-32 h-40 glass-panel border-2 border-primary/30 rounded-xl overflow-hidden flex flex-col">
                      <div className={cn(
                        'flex-1 flex items-center justify-center',
                        `bg-gradient-to-br from-element-${slot.element.toLowerCase()}/20 to-transparent`
                      )}>
                        <ElementIcon element={slot.element} size="lg" />
                      </div>
                      <div className="p-2 text-center">
                        <p className="text-xs font-medium text-foreground">{slot.element}</p>
                        <p className="text-xs text-muted-foreground font-mono">#{slot.tokenId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromSlot(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSelector(index)}
                    className="w-32 h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Plus className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Slot {index + 1}</span>
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex items-center">
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-primary"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
          </div>

          {/* Output Preview */}
          <motion.div
            animate={canCraft ? { scale: [1, 1.02, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
              'w-36 h-48 rounded-xl flex flex-col items-center justify-center gap-3 border-2',
              canCraft
                ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/5 gold-glow'
                : 'border-dashed border-border bg-muted/20'
            )}
          >
            <div className="text-4xl">✨</div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {canCraft ? 'Ready to Craft!' : 'Mystery Element'}
              </p>
              <p className="text-xs text-muted-foreground">
                {canCraft ? 'Tier 2 NFT' : 'Select 3 Elements'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Cost Warning */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <span>Requires <span className="font-mono text-primary">{CRAFT_FEE} ETH</span> Protocol Fee</span>
        </div>

        {/* Transmute Button */}
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            disabled={!canCraft || isCrafting}
            onClick={handleCraft}
            className={cn(
              'px-12',
              canCraft && 'animate-glow'
            )}
          >
            {isCrafting ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Transmuting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5" />
                Transmute
              </span>
            )}
          </Button>
        </div>
      </motion.div>

      {/* NFT Selector Modal */}
      <AnimatePresence>
        {showSelector !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSelector(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Select Element for Slot {showSelector + 1}</h3>
                <button
                  onClick={() => setShowSelector(null)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {availableNFTs.map((nft) => (
                  <NFTCard
                    key={nft.tokenId}
                    nft={nft}
                    variant="crafting"
                    onSelect={() => handleSelectNFT(showSelector, nft)}
                  />
                ))}
              </div>

              {availableNFTs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No Elements available for crafting</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
