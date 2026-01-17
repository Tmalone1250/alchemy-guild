import { motion } from 'framer-motion';
import { Vault, TrendingUp, Layers, Coins } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { MintWidget } from '@/components/dashboard/MintWidget';
import { ActivityTable } from '@/components/dashboard/ActivityTable';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { ELEMENT_NFT_ABI, YIELD_VAULT_ABI } from '@/config/abis';

export default function Dashboard() {
  const { address } = useAccount();

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.ElementNFT.address,
    abi: ELEMENT_NFT_ABI,
    functionName: 'totalSupply',
  });

  const { data: totalWeight } = useReadContract({
    address: CONTRACTS.YieldVault.address,
    abi: YIELD_VAULT_ABI,
    functionName: 'sTotalWeight',
  });

  const { data: accRewardPerWeight } = useReadContract({
    address: CONTRACTS.YieldVault.address,
    abi: YIELD_VAULT_ABI,
    functionName: 'sAccRewardPerWeight',
  });

  const formatYieldIndex = (value: bigint | undefined) => {
    if (!value) return '1.0000';
    return (Number(value) / 1e18).toFixed(4);
  };
  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Protocol overview and quick actions</p>
      </motion.div>

      {/* Protocol Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Value Locked"
          value="$0.00"
          subtitle="Across all vaults"
          icon={Vault}
          variant="gold"
        />
        <StatCard
          title="Global Yield Index"
          value={formatYieldIndex(accRewardPerWeight)}
          subtitle="Current multiplier"
          icon={TrendingUp}
          trend={{ value: '+2.1%', positive: true }}
        />
        <StatCard
          title="Total Staked Weight"
          value={totalWeight ? totalWeight.toString() : '0'}
          subtitle="Staking power"
          icon={Layers}
        />
        <StatCard
          title="Total Minted"
          value={totalSupply ? totalSupply.toString() : '0'}
          subtitle="Elements created"
          icon={Coins}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mint Widget */}
        <div className="lg:col-span-1">
          <MintWidget />
        </div>

        {/* Activity Table */}
        <div className="lg:col-span-2">
          <ActivityTable />
        </div>
      </div>
    </div>
  );
}
