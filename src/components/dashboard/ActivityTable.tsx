import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles, ArrowDownToLine, ArrowUpFromLine, Coins, FlaskConical } from 'lucide-react';
import { ActivityEvent } from '@/types/nft';
import { cn } from '@/lib/utils';

const activityConfig: Record<ActivityEvent['type'], { icon: typeof Coins; label: string; color: string }> = {
  mint: { icon: Sparkles, label: 'Minted', color: 'text-primary' },
  stake: { icon: ArrowDownToLine, label: 'Staked', color: 'text-emerald-400' },
  unstake: { icon: ArrowUpFromLine, label: 'Unstaked', color: 'text-orange-400' },
  claim: { icon: Coins, label: 'Claimed', color: 'text-gold' },
  craft: { icon: FlaskConical, label: 'Crafted', color: 'text-purple-400' },
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityTable() {
  const mockActivity: ActivityEvent[] = [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          View All <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {mockActivity.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No recent activity</p>
          <p className="text-sm text-muted-foreground mt-2">Mint, stake, or craft to see activity here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mockActivity.slice(0, 5).map((event, index) => {
            const config = activityConfig[event.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-muted', config.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{config.label}</span>
                    {event.tokenId && (
                      <span className="text-xs text-muted-foreground font-mono">#{event.tokenId}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate font-mono">{event.txHash}</p>
                </div>
                {event.amount && (
                  <div className="text-right">
                    <span className="text-sm font-mono text-gold-gradient">${event.amount}</span>
                    <p className="text-xs text-muted-foreground">USDC</p>
                  </div>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(event.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
