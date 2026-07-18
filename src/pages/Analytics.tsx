import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Coins, Flame, Compass, ShieldAlert } from 'lucide-react';
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
import { useGuildOracle } from '@/hooks/useGuildOracle';
import { TIERS } from '@/config/contracts';
import PriceChart from '@/components/dashboard/PriceChart';

export default function Analytics() {
  const {
    uniqueHolders,
    totalYieldClaimed,
    stakingByTier,
    yieldHistory,
    isLoading: isStatsLoading,
    tvl
  } = useProtocolStats();

  const {
    guildPerWeth,
    guildBurned,
    usdcDepth,
    wethDepth,
    isLoading: isOracleLoading,
  } = useGuildOracle();

  const isLoading = isStatsLoading || isOracleLoading;

  const stakingData = TIERS.map(tier => ({
    name: tier.name,
    staked: stakingByTier[tier.id] || 0,
  }));

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground animate-pulse">Loading live protocol analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-void-black text-foreground min-h-screen">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-primary/10 pb-6"
      >
        <div>
          <h1 className="text-4xl font-bold text-foreground font-cinzel tracking-wider text-gold-gradient">
            Live Protocol Analytics
          </h1>
          <p className="text-muted-foreground mt-1 font-lato">
            On-chain price data proving the live deflationary economics of the Guild Token.
          </p>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Price Feed"
          value={`${guildPerWeth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GUILD / WETH`}
          subtitle="Live Uniswap V3 Pool Price"
          icon={TrendingUp}
          variant="gold"
        />
        <StatCard
          title="Total GUILD Burned"
          value={`${guildBurned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} GUILD`}
          subtitle="Permanently Deflated by DAO"
          icon={Flame}
          variant="gold"
          trend={{ value: "Deflationary", positive: true }}
        />
        <StatCard
          title="Protocol TVL (Vault)"
          value={`${parseFloat(tvl).toFixed(2)} USDC`}
          subtitle="Active Yield-Generating TVL"
          icon={Coins}
        />
        <StatCard
          title="Total Yield Claimed"
          value={`${parseFloat(totalYieldClaimed).toFixed(2)} USDC`}
          subtitle="Harvested by Stakers"
          icon={BarChart3}
        />
      </div>

      {/* Deep-Dive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live TradingView Price Chart */}
        <div className="lg:col-span-2">
          <PriceChart />
        </div>

        {/* Protocol-Owned Liquidity (POL) Depth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 col-span-1 border border-primary/20 bg-black/60 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground font-cinzel">Liquidity Depth</h3>
              <p className="text-xs text-muted-foreground">YieldVault backing reserves</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">USDC Reserves</span>
                <span className="font-mono font-semibold text-foreground">
                  {usdcDepth.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC
                </span>
              </div>
              <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">WETH Reserves</span>
                <span className="font-mono font-semibold text-foreground">
                  {wethDepth.toLocaleString(undefined, { minimumFractionDigits: 4 })} WETH
                </span>
              </div>
              <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary/60 h-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-500 flex gap-3">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                These token reserves represent the protocol-owned liquidity backing element mints, serving as a hard price floor for the ecosystem.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Yield & Staking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yield History Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 lg:col-span-2 border border-primary/20 bg-black/60 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-foreground font-cinzel mb-6">Cumulative Yield Distributed</h3>
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
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 14%, 7%)',
                    border: '1px solid hsl(220, 14%, 16%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                  formatter={(value: number) => [`$${value.toFixed(2)} USDC`, 'Yield']}
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

        {/* Staked by Tier Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 border border-primary/20 bg-black/60 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-foreground font-cinzel mb-6">Staked by Tier</h3>
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
