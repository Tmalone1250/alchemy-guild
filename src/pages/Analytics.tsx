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

// Mock chart data
const tvlData = [
  { name: 'Jan', value: 1200000 },
  { name: 'Feb', value: 1450000 },
  { name: 'Mar', value: 1380000 },
  { name: 'Apr', value: 1620000 },
  { name: 'May', value: 1890000 },
  { name: 'Jun', value: 2100000 },
  { name: 'Jul', value: 2847392 },
];

const stakingData = [
  { name: 'Lead', staked: 847, unstaked: 2102 },
  { name: 'Silver', staked: 312, unstaked: 398 },
  { name: 'Gold', staked: 88, unstaked: 145 },
];

const elementDistribution = [
  { name: 'Fire', count: 712 },
  { name: 'Water', count: 654 },
  { name: 'Earth', count: 623 },
  { name: 'Wind', count: 589 },
  { name: 'Lightning', count: 534 },
  { name: 'Ice', count: 780 },
];

export default function Analytics() {
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
          title="30d Volume"
          value="$847.2K"
          icon={BarChart3}
          trend={{ value: '+23.4%', positive: true }}
        />
        <StatCard
          title="Unique Holders"
          value="1,247"
          icon={Users}
          trend={{ value: '+12.1%', positive: true }}
        />
        <StatCard
          title="Avg. Yield Rate"
          value="8.47%"
          icon={TrendingUp}
          variant="gold"
        />
        <StatCard
          title="Total Rewards"
          value="$124.5K"
          icon={Coins}
          subtitle="Distributed to stakers"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TVL Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Total Value Locked</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tvlData}>
                <defs>
                  <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis
                  stroke="hsl(215, 15%, 55%)"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 14%, 7%)',
                    border: '1px solid hsl(220, 14%, 16%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'TVL']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(43, 96%, 56%)"
                  strokeWidth={2}
                  fill="url(#tvlGradient)"
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
          <h3 className="text-lg font-semibold text-foreground mb-6">Staking by Tier</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stakingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 14%, 7%)',
                    border: '1px solid hsl(220, 14%, 16%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                />
                <Bar dataKey="staked" name="Staked" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unstaked" name="Unstaked" fill="hsl(220, 14%, 25%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Element Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Element Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={elementDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 14%, 7%)',
                    border: '1px solid hsl(220, 14%, 16%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                />
                <Bar dataKey="count" fill="hsl(43, 96%, 56%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
