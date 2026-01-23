import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import {
  LayoutDashboard,
  Grid3X3,
  FlaskConical,
  Vault,
  BarChart3,
  Hexagon,
  Wallet,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectButton } from '@/components/ui/connect-button';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Grid3X3 },
  { path: '/lab', label: 'The Lab', icon: FlaskConical },
  { path: '/vault', label: 'The Vault', icon: Vault },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address: address,
  });

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: typeof balance) => {
    if (!bal) return '0.0000';
    return parseFloat(formatEther(bal.value)).toFixed(4);
  };

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Hexagon className="w-10 h-10 text-primary fill-primary/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse-gold" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Alchemy Guild</h1>
            <p className="text-xs text-muted-foreground">Sepolia Testnet</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-sidebar-accent group relative',
                isActive
                  ? 'bg-sidebar-accent text-primary'
                  : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={cn('w-5 h-5 transition-colors', isActive && 'text-primary')} />
              <span>{item.label}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto text-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Wallet Status */}
      <div className="p-4 border-t border-sidebar-border">
        {isConnected && address ? (
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-foreground truncate">
                  {formatAddress(address)}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{formatBalance(balance?.formatted)}</span> ETH
                </p>
              </div>
              <button
                onClick={() => disconnect()}
                className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors group"
                title="Disconnect Wallet"
              >
                <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
              </button>
            </div>
          </div>
        ) : (
          <ConnectButton />
        )}
      </div>
    </aside>
  );
}
