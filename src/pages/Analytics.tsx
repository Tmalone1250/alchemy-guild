import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Coins, Users } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useProtocolStats } from '@/hooks/useProtocolStats';
import { TIERS } from '@/config/contracts';

export default function Analytics() {
  const {
    uniqueHolders,
    totalYieldClaimed,
    stakingByTier,
    yieldHistory,
    isLoading,
    volume24h,
    tvl
  } = useProtocolStats();

  const stakingData = TIERS.map(tier => ({
    name: tier.name,
    staked: stakingByTier[tier.id] || 0,
  }));

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Protocol performance and metrics</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Yield Claimed"
          value={`${parseFloat(totalYieldClaimed).toFixed(2)} GOLD`}
          icon={BarChart3}
          trend={{ value: 'All time', positive: true }}
        />
        <StatCard
          title="Unique Holders"
          value={uniqueHolders.toString()}
          icon={Users}
          trend={{ value: 'Active', positive: true }}
        />
        <StatCard
          title="Protocol TVL"
          value={`${parseFloat(tvl).toFixed(2)} GOLD`}
          icon={Coins}
          variant="gold"
          subtitle="Total Value Locked"
        />
        <StatCard
          title="24h Volume"
          value={`${parseFloat(volume24h).toFixed(4)} MANA`}
          icon={TrendingUp}
          subtitle="Mana Pool"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yield History Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Cumulative Yield Distributed</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yieldHistory}>
                <defs>
                  <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                <XAxis dataKey="date" stroke="hsl(215, 15%, 55%)" fontSize={12} tick={false} />
                <YAxis
                  stroke="hsl(215, 15%, 55%)"
                  fontSize={12}
                  tickFormatter={(value) => `${value.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 14%, 7%)',
                    border: '1px solid hsl(220, 14%, 16%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                  formatter={(value: number) => [`${value.toFixed(2)} GOLD`, 'Yield']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(43, 96%, 56%)"
                  strokeWidth={2}
                  fill="url(#yieldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Staking Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Staked by Tier</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stakingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 14%, 7%)',
                    border: '1px solid hsl(220, 14%, 16%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                />
                <Bar dataKey="staked" name="Staked" fill="hsl(43, 96%, 56%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
