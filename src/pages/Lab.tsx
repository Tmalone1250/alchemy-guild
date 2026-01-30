import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Plus, Sparkles, AlertTriangle, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFTCard } from '@/components/ui/nft-card';
import { ElementIcon } from '@/components/ui/element-icon';
import { CRAFT_FEE } from '@/config/contracts';
import { NFT } from '@/types/nft';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
// import { useAccount } from 'wagmi';
import { useAlchemist, useUserNFTs } from '@/hooks/useContracts';


const RECIPES = [
  { inputs: ['Water', 'Lightning', 'Lightning'], output: 'Plasma', outputTier: 2 },
  { inputs: ['Wind', 'Wind', 'Lightning'], output: 'Tornado', outputTier: 2 },
  { inputs: ['Wind', 'Ice', 'Ice'], output: 'Blizzard', outputTier: 2 },
  { inputs: ['Water', 'Water', 'Wind'], output: 'Tsunami', outputTier: 2 },
  { inputs: ['Earth', 'Earth', 'Fire'], output: 'Quake', outputTier: 2 },
  { inputs: ['Wind', 'Fire', 'Fire'], output: 'Inferno', outputTier: 2 },
  { inputs: ['Lightning', 'Plasma', 'Plasma'], output: 'Holy', outputTier: 3 },
  { inputs: ['Water', 'Tsunami', 'Tsunami'], output: 'Dark', outputTier: 3 },
  { inputs: ['Earth', 'Quake', 'Quake'], output: 'Gravity', outputTier: 3 },
  { inputs: ['Wind', 'Tornado', 'Tornado'], output: 'Time', outputTier: 3 },
  { inputs: ['Ice', 'Blizzard', 'Blizzard'], output: 'Bio', outputTier: 3 },
  { inputs: ['Fire', 'Inferno', 'Inferno'], output: 'Spirit', outputTier: 3 },
];

import { useSmartAccount } from '@/hooks/useSmartAccount';

export default function Lab() {
  const { smartAccountAddress } = useSmartAccount();
  const { nfts, isLoading } = useUserNFTs(smartAccountAddress);
  const [selectedSlots, setSelectedSlots] = useState<(NFT | null)[]>([null, null, null]);
  const [showSelector, setShowSelector] = useState<number | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const { craft, isPending, isConfirming, isSuccess, error } = useAlchemist();

  const availableNFTs = nfts.filter((nft) => !nft.staked);

  const canCraft = selectedSlots.every((slot) => slot !== null);

  const elementToNumber: Record<string, number> = {
    'Earth': 0, 'Water': 1, 'Wind': 2, 'Fire': 3, 'Ice': 4, 'Lightning': 5,
    'Plasma': 6, 'Tornado': 7, 'Blizzard': 8, 'Tsunami': 9, 'Quake': 10,
    'Inferno': 11, 'Holy': 12, 'Dark': 13, 'Gravity': 14, 'Time': 15,
    'Bio': 16, 'Spirit': 17,
  };

  const getRecipeOutput = () => {
    if (!canCraft) return null;

    const selectedNums = selectedSlots
      .filter((slot): slot is NFT => slot !== null)
      .map((slot) => elementToNumber[slot.element])
      .sort((a, b) => a - b);

    return RECIPES.find((r) => {
      const recipeNums = [...r.inputs]
        .map((el) => elementToNumber[el])
        .sort((a, b) => a - b);
      return JSON.stringify(recipeNums) === JSON.stringify(selectedNums);
    }) || null;
  };

  const recipeOutput = getRecipeOutput();

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

    const tokenIds = selectedSlots
      .filter((slot): slot is NFT => slot !== null)
      .map((slot) => BigInt(slot.tokenId)) as [bigint, bigint, bigint];

    try {
      toast.loading('Confirm transaction in your wallet...', { id: 'craft' });
      await craft(tokenIds);
      toast.loading('Transmuting Elements...', { id: 'craft' });
    } catch (err: any) {
      if (err.message?.includes('User rejected')) {
        toast.error('Transaction rejected', { id: 'craft' });
      } else {
        toast.error('Failed to craft', { id: 'craft' });
      }
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success('Transmutation complete! New Element created!', { id: 'craft' });
      setSelectedSlots([null, null, null]);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      toast.error('Transaction failed', { id: 'craft' });
    }
  }, [error]);

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
          <div className="flex flex-wrap justify-center gap-4">
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
            animate={canCraft && recipeOutput ? { scale: [1, 1.02, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
              'w-36 h-48 rounded-xl flex flex-col items-center justify-center gap-3 border-2',
              canCraft && recipeOutput
                ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/5 gold-glow'
                : canCraft && !recipeOutput
                  ? 'border-destructive bg-destructive/5'
                  : 'border-dashed border-border bg-muted/20'
            )}
          >
            {recipeOutput ? (
              <>
                <div className="text-4xl">✨</div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {recipeOutput.output}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tier {recipeOutput.outputTier} NFT
                  </p>
                </div>
              </>
            ) : canCraft ? (
              <>
                <div className="text-4xl">❌</div>
                <div className="text-center">
                  <p className="text-sm font-medium text-destructive">
                    Invalid Recipe
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Check recipes
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl">✨</div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Mystery Element
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Select 3 Elements
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Cost Warning */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <span>Requires <span className="font-mono text-primary">{CRAFT_FEE} ETH</span> Protocol Fee</span>
        </div>

        {/* Recipes Button */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRecipes(true)}
            className="flex items-center gap-2"
          >
            <Info className="w-4 h-4" />
            View Recipes
          </Button>
        </div>

        {/* Transmute Button */}
        <div className="mt-4 flex justify-center">
          <Button
            size="lg"
            disabled={!canCraft || !recipeOutput || isPending || isConfirming}
            onClick={handleCraft}
            className={cn(
              'px-12',
              canCraft && recipeOutput && 'animate-glow'
            )}
          >
            {isPending || isConfirming ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {isPending ? 'Confirm in wallet...' : 'Transmuting...'}
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

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="glass-panel h-48 animate-pulse" />
                  ))}
                </div>
              ) : (
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
              )}

              {!isLoading && availableNFTs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No Elements available for crafting</p>
                  <p className="text-xs text-muted-foreground mt-2">Unstake your Elements in the Vault to use them here</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipes Modal */}
      <AnimatePresence>
        {showRecipes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRecipes(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 max-w-3xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Crafting Recipes</h3>
                <button
                  onClick={() => setShowRecipes(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {RECIPES.map((recipe, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {recipe.inputs.map((input, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-sm font-medium">{input}</span>
                              {i < recipe.inputs.length - 1 && <span className="text-muted-foreground">+</span>}
                            </div>
                          ))}
                        </div>
                        <Sparkles className="w-4 h-4 text-primary mx-2" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{recipe.output}</p>
                        <p className="text-xs text-muted-foreground">Tier {recipe.outputTier}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
