import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles, ArrowDownToLine, ArrowUpFromLine, Coins, FlaskConical, Loader2, ExternalLink } from 'lucide-react';
import { ActivityEvent } from '@/types/nft';
import { cn } from '@/lib/utils';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { CONTRACTS } from '@/config/contracts';

const activityConfig: Record<ActivityEvent['type'], { icon: typeof Coins; label: string; color: string }> = {
  mint: { icon: Sparkles, label: 'Minted', color: 'text-primary' },
  stake: { icon: ArrowDownToLine, label: 'Staked', color: 'text-emerald-500' },
  unstake: { icon: ArrowUpFromLine, label: 'Unstaked', color: 'text-orange-500' },
  claim: { icon: Coins, label: 'Claimed', color: 'text-yellow-500' },
  craft: { icon: FlaskConical, label: 'Crafted', color: 'text-purple-500' },
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000); // timestamp is in seconds from hook? No, hook sets it to block timestamp (seconds) or millis?
  // Hook code: blockTimestamps.set(..., Number(block.timestamp)) -> block.timestamp is seconds in viem/wagmi usually.
  // JS Date.now() is millis.
  // Let's verify hook. Hook uses: Number(block.timestamp). Ethereum timestamps are seconds.
  // So we need to multiply by 1000 to compare with Date.now() or divide Date.now().
  // Let's adjust formatTimeAgo to handle seconds input.

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityTable() {
  const { activities, isLoading } = useRecentActivity();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentActivities = activities.slice(startIndex, startIndex + itemsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Recent Activity
        </h3>
        <a
          href={CONTRACTS.ElementNFT.chainId === 11155111 ? "https://sepolia.etherscan.io/address/" + CONTRACTS.ElementNFT.address : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View Contract <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[350px]">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Syncing blockchain events...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-1 py-12">
            <p>No recent activity</p>
            <p className="text-sm opacity-50">Mint, stake, or craft to see activity here</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentActivities.map((event, index) => {
                const config = activityConfig[event.type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                  >
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-background/50 border border-white/5', config.color)}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{config.label}</span>
                        {event.tokenId && (
                          <span className="text-xs text-muted-foreground font-mono bg-white/5 px-1.5 py-0.5 rounded">
                            #{event.tokenId}
                          </span>
                        )}
                      </div>
                      <a
                        href={`${CONTRACTS.ElementNFT.chainId === 11155111 ? 'https://sepolia.etherscan.io' : 'https://etherscan.io'}/tx/${event.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground truncate font-mono hover:text-primary transition-colors flex items-center gap-1 w-fit"
                      >
                        {event.txHash.slice(0, 6)}...{event.txHash.slice(-4)}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>

                    <div className="text-right shrink-0">
                      {event.amount && (
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-mono text-gold-gradient font-medium">
                            +{event.amount}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">Gold</span>
                        </div>
                      )}
                      {!event.amount && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap block">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      )}
                      {event.amount && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap block mt-0.5">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-1.5 rounded-md hover:bg-white/5"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  Page <span className="text-foreground font-medium">{currentPage}</span> of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-1.5 rounded-md hover:bg-white/5"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
