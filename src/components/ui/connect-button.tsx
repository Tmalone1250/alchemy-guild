import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Wallet, LogOut, Copy, ExternalLink, Smartphone, Globe, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const handleViewOnExplorer = () => {
    if (address && chain) {
      const explorerUrl = chain.blockExplorers?.default.url;
      if (explorerUrl) {
        window.open(`${explorerUrl}/address/${address}`, '_blank');
      }
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getConnectorIcon = (name: string) => {
    if (name.toLowerCase().includes('walletconnect')) return <Smartphone className="w-5 h-5" />;
    if (name.toLowerCase().includes('coinbase')) return <CreditCard className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/50">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-mono">{formatAddress(address)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Connected Wallet</span>
              <span className="font-mono text-sm">{formatAddress(address)}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={handleCopyAddress} className="gap-2 cursor-pointer focus:bg-white/5">
            <Copy className="w-4 h-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewOnExplorer} className="gap-2 cursor-pointer focus:bg-white/5">
            <ExternalLink className="w-4 h-4" />
            View on Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={() => disconnect()} className="gap-2 text-destructive cursor-pointer focus:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20 animate-pulse-subtle">
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to Alchemy Guild
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              variant="outline"
              onClick={() => connect({ connector })}
              className="w-full h-14 justify-start gap-4 text-base font-medium border-white/10 hover:bg-white/5 hover:border-primary/50 transition-all group"
            >
              <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/10 transition-colors">
                {getConnectorIcon(connector.name)}
              </div>
              <span>{connector.name}</span>
              {connector.name.toLowerCase().includes('injected') && (
                <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">Browser</span>
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
