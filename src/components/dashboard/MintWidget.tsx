import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mountain, Flame, Droplets, Wind, Snowflake, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ElementType, ELEMENTS } from '@/config/contracts';
import { toast } from 'sonner';
import { useElementNFT } from '@/hooks/useContracts';
import { useAccount } from 'wagmi';

const elementIcons = {
  Earth: Mountain,
  Fire: Flame,
  Water: Droplets,
  Wind: Wind,
  Ice: Snowflake,
  Lightning: Zap,
};

const elementStyles: Record<string, string> = {
  Earth: 'bg-element-earth/10 border-element-earth/30 hover:bg-element-earth/20 text-element-earth',
  Water: 'bg-element-water/10 border-element-water/30 hover:bg-element-water/20 text-element-water',
  Wind: 'bg-element-wind/10 border-element-wind/30 hover:bg-element-wind/20 text-element-wind',
  Fire: 'bg-element-fire/10 border-element-fire/30 hover:bg-element-fire/20 text-element-fire',
  Ice: 'bg-element-ice/10 border-element-ice/30 hover:bg-element-ice/20 text-element-ice',
  Lightning: 'bg-element-lightning/10 border-element-lightning/30 hover:bg-element-lightning/20 text-element-lightning',
};

export function MintWidget() {
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(null);
  const { publicMint, isPending, isConfirming, isSuccess, error } = useElementNFT();
  const { address } = useAccount();

  const handleMint = async () => {
    if (!selectedElement) return;

    const elementIndex = ELEMENTS.findIndex(el => el.name === selectedElement);
    if (elementIndex === -1) return;

    try {
      console.log('MintWidget: Initiating minting process for element:', selectedElement, 'index:', elementIndex);
      console.log('MintWidget: Connected address:', address);
      const tx = await publicMint(elementIndex);
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
      console.log('MintWidget: isSuccess triggered. Successfully minted:', selectedElement);
      toast.success(`Successfully minted ${selectedElement} Element! (+10 GUILD Subsidy Granted)`, { id: 'mint' });
      setSelectedElement(null);
    }
  }, [isSuccess, selectedElement]);

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
          <h3 className="text-lg font-semibold text-foreground">Mint New Element</h3>
          <p className="text-sm text-muted-foreground">Select an element to mint</p>
        </div>
      </div>

      {/* Governance Subsidy Pill */}
      <div className="mb-5 p-3 rounded-xl border border-primary/30 bg-primary/5 gold-glow flex flex-col gap-2">
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/40 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Includes +10 GUILD Governance Subsidy
          </span>
        </div>
      </div>

      {/* Element Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {ELEMENTS.filter(el => el.id < 6).map((element) => {
          const Icon = elementIcons[element.name];
          const isSelected = selectedElement === element.name;

          return (
            <motion.button
              key={element.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedElement(element.name)}
              className={cn(
                'relative p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2',
                elementStyles[element.name],
                isSelected && 'ring-2 ring-primary gold-glow'
              )}
            >
              <Icon className="w-8 h-8" />
              <span className="text-xs font-medium">{element.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Mint Button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!selectedElement || isPending || isConfirming}
        onClick={handleMint}
      >
        {isPending || isConfirming ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            {isPending ? 'Confirm in wallet...' : 'Minting...'}
          </span>
        ) : selectedElement ? (
          `Mint ${selectedElement} Element (0.002 ETH)`
        ) : (
          'Select an Element'
        )}
      </Button>


      <p className="text-xs text-muted-foreground text-center mt-3 animate-pulse">
        ** Please refresh the page after minting to mint another. **
      </p>
    </motion.div>
  );
}
