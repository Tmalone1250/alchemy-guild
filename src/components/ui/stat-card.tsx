import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: 'default' | 'gold';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass-panel p-6 card-hover',
        variant === 'gold' && 'border-primary/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn(
            'text-2xl font-semibold font-mono',
            variant === 'gold' ? 'text-gold-gradient' : 'text-foreground'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'text-xs font-medium',
              trend.positive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend.positive ? '+' : ''}{trend.value}
            </p>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          variant === 'gold'
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}
