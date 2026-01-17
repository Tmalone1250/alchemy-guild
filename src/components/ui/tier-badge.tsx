import { TierType } from '@/config/contracts';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: TierType;
  size?: 'sm' | 'md';
  className?: string;
}

export function TierBadge({ tier, size = 'md', className }: TierBadgeProps) {
  const tierClasses: Record<TierType, string> = {
    Lead: 'tier-lead',
    Silver: 'tier-silver',
    Gold: 'tier-gold',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        tierClasses[tier],
        sizeClasses[size],
        className
      )}
    >
      {tier}
    </span>
  );
}
