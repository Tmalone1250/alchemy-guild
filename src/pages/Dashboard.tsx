import { motion } from 'framer-motion';
import { Vault, TrendingUp, Layers, Coins } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { MintWidget } from '@/components/dashboard/MintWidget';
import { ActivityTable } from '@/components/dashboard/ActivityTable';
import { mockProtocolStats } from '@/data/mockData';

export default function Dashboard() {
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
          value={`$${mockProtocolStats.tvl}`}
          subtitle="Across all vaults"
          icon={Vault}
          variant="gold"
          trend={{ value: '+12.4%', positive: true }}
        />
        <StatCard
          title="Global Yield Index"
          value={mockProtocolStats.globalYieldIndex}
          subtitle="Current multiplier"
          icon={TrendingUp}
          trend={{ value: '+2.1%', positive: true }}
        />
        <StatCard
          title="Total Staked"
          value={mockProtocolStats.totalStaked.toLocaleString()}
          subtitle="NFTs in vault"
          icon={Layers}
        />
        <StatCard
          title="Total Minted"
          value={mockProtocolStats.totalMinted.toLocaleString()}
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
