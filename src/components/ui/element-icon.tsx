import { Mountain, Flame, Droplets, Wind, Snowflake, Zap, Cloud, Sparkles, Eye } from 'lucide-react';
import { ElementType } from '@/config/contracts';
import { cn } from '@/lib/utils';

const elementConfig: Record<ElementType, { icon: typeof Mountain; className: string }> = {
  // Tier I
  Earth: { icon: Mountain, className: 'text-element-earth' },
  Water: { icon: Droplets, className: 'text-element-water' },
  Wind: { icon: Wind, className: 'text-element-wind' },
  Fire: { icon: Flame, className: 'text-element-fire' },
  Ice: { icon: Snowflake, className: 'text-element-ice' },
  Lightning: { icon: Zap, className: 'text-element-lightning' },
  // Tier II
  Plasma: { icon: Zap, className: 'text-yellow-400' },
  Tornado: { icon: Wind, className: 'text-cyan-400' },
  Blizzard: { icon: Snowflake, className: 'text-blue-300' },
  Tsunami: { icon: Droplets, className: 'text-blue-400' },
  Quake: { icon: Mountain, className: 'text-amber-600' },
  Inferno: { icon: Flame, className: 'text-orange-500' },
  // Tier III
  Holy: { icon: Sparkles, className: 'text-yellow-300' },
  Dark: { icon: Eye, className: 'text-purple-600' },
  Gravity: { icon: Mountain, className: 'text-slate-700' },
  Time: { icon: Wind, className: 'text-indigo-400' },
  Bio: { icon: Droplets, className: 'text-green-500' },
  Spirit: { icon: Flame, className: 'text-purple-400' },
};

interface ElementIconProps {
  element: ElementType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ElementIcon({ element, size = 'md', className }: ElementIconProps) {
  const config = elementConfig[element];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Icon className={cn(sizeClasses[size], config.className, className)} />
  );
}
