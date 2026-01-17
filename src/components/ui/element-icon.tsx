import { Mountain, Flame, Droplets, Wind, Snowflake, Zap } from 'lucide-react';
import { ElementType } from '@/config/contracts';
import { cn } from '@/lib/utils';

const elementConfig: Record<ElementType, { icon: typeof Mountain; className: string }> = {
  Earth: { icon: Mountain, className: 'text-element-earth' },
  Fire: { icon: Flame, className: 'text-element-fire' },
  Water: { icon: Droplets, className: 'text-element-water' },
  Wind: { icon: Wind, className: 'text-element-wind' },
  Ice: { icon: Snowflake, className: 'text-element-ice' },
  Lightning: { icon: Zap, className: 'text-element-lightning' },
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
