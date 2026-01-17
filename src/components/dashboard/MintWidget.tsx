import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mountain, Flame, Droplets, Wind, Snowflake, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ElementType, ELEMENTS } from '@/config/contracts';
import { toast } from 'sonner';
import { useElementNFT } from '@/hooks/useContracts';

const elementIcons = {
  Earth: Mountain,
  Fire: Flame,
  Water: Droplets,
  Wind: Wind,
  Ice: Snowflake,
  Lightning: Zap,
};

const elementStyles: Record<ElementType, string> = {
  Earth: 'bg-element-earth/10 border-element-earth/30 hover:bg-element-earth/20 text-element-earth',
  Fire: 'bg-element-fire/10 border-element-fire/30 hover:bg-element-fire/20 text-element-fire',
  Water: 'bg-element-water/10 border-element-water/30 hover:bg-element-water/20 text-element-water',
  Wind: 'bg-element-wind/10 border-element-wind/30 hover:bg-element-wind/20 text-element-wind',
  Ice: 'bg-element-ice/10 border-element-ice/30 hover:bg-element-ice/20 text-element-ice',
  Lightning: 'bg-element-lightning/10 border-element-lightning/30 hover:bg-element-lightning/20 text-element-lightning',
};

export function MintWidget() {
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(null);
  const { publicMint, isPending, isConfirming, isSuccess, error } = useElementNFT();

  const handleMint = async () => {
    if (!selectedElement) return;
    
    const elementIndex = ELEMENTS.findIndex(el => el.name === selectedElement);
    if (elementIndex === -1) return;

    try {
      toast.loading('Confirm transaction in your wallet...', { id: 'mint' });
      await publicMint(elementIndex);
      toast.loading('Minting your Element NFT...', { id: 'mint' });
    } catch (err: any) {
      if (err.message?.includes('User rejected')) {
        toast.error('Transaction rejected', { id: 'mint' });
      } else {
        toast.error('Failed to mint NFT', { id: 'mint' });
      }
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(`Successfully minted ${selectedElement} Element!`, { id: 'mint' });
      setSelectedElement(null);
    }
  }, [isSuccess, selectedElement]);

  useEffect(() => {
    if (error) {
      toast.error('Transaction failed', { id: 'mint' });
    }
  }, [error]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Mint New Element</h3>
          <p className="text-sm text-muted-foreground">Select an element to mint</p>
        </div>
      </div>

      {/* Element Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {ELEMENTS.map((element) => {
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
    </motion.div>
  );
}
