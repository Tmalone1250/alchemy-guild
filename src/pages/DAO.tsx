import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldingLab } from '@/components/dao/ShieldingLab';
import { GovernanceFeed } from '@/components/dao/GovernanceFeed';
import { AdminConsole } from '@/components/dao/AdminConsole';
import {
  Landmark,
  Cpu,
  ExternalLink,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import {
  GUILD_TOKEN_ADDRESS,
  CGUILD_ADDRESS,
  GUILD_DAO_ADDRESS,
} from '@/config/contracts';

export default function DAO() {
  const [activeView, setActiveView] = useState<'all' | 'shield' | 'proposals'>('all');

  return (
    <div className="min-h-screen bg-[#050308] text-white py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#d4af37]/20 pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-mono text-[#d4af37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 2: Confidential Dual-Token TEE Governance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
              <Landmark className="w-9 h-9 sm:w-11 sm:h-11 text-[#d4af37]" />
              The Council Chambers
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Cryptographically protected voting powered by <span className="text-white font-semibold">iExec Nox Intel TDX Enclaves</span>. Shield your public <code className="text-[#d4af37]">GUILD</code> into confidential <code className="text-[#d4af37]">cGUILD</code> (`ERC7984`) handles to participate without leaking your voting weight or front-running your position.
            </p>
          </div>

          {/* Quick navigation view filters */}
          <div className="flex items-center gap-2 bg-black/80 border border-[#d4af37]/30 p-1.5 rounded-xl self-start md:self-auto shadow-md">
            <button
              onClick={() => setActiveView('all')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-mono font-medium transition-all ${
                activeView === 'all'
                  ? 'bg-gradient-to-r from-[#d4af37] to-amber-600 text-black font-bold shadow'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              All Chambers
            </button>
            <button
              onClick={() => setActiveView('shield')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-mono font-medium transition-all ${
                activeView === 'shield'
                  ? 'bg-gradient-to-r from-[#d4af37] to-amber-600 text-black font-bold shadow'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Shielding Lab
            </button>
            <button
              onClick={() => setActiveView('proposals')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-mono font-medium transition-all ${
                activeView === 'proposals'
                  ? 'bg-gradient-to-r from-[#d4af37] to-amber-600 text-black font-bold shadow'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Governance Feed
            </button>
          </div>
        </div>

        {/* Documentation Banner Link */}
        <div className="rounded-2xl bg-gradient-to-r from-[#050308] via-black to-[#050308] border border-[#d4af37]/40 p-5 sm:p-6 shadow-[0_0_25px_rgba(212,175,55,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Confidential Governance & POL Architecture Specification
              </h3>
              <p className="text-xs text-muted-foreground">
                Deep dive into Deflationary Burn Dynamics (S(t)), Phase 1 POL Growth (ΔL_POL), and O(1) AI Enclave Access Keys.
              </p>
            </div>
          </div>
          <Link
            to="/docs/dao"
            className="px-5 py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all flex items-center gap-2 shrink-0"
          >
            <span>Read Technical Docs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Verified Base Sepolia Architecture Links Bar */}
        <div className="bg-black/80 rounded-xl border border-white/10 p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Cpu className="w-4 h-4 text-[#d4af37]" />
            <span>Arbitrum Sepolia (`chainId: 421614`) Verified Deployment Architecture:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href={`https://sepolia.arbiscan.io/address/${GUILD_TOKEN_ADDRESS}`} target="_blank" rel="noreferrer" className="text-amber-200/80 hover:text-[#d4af37] transition-colors flex items-center gap-1">
              <span>GUILD: {GUILD_TOKEN_ADDRESS.slice(0, 6)}...{GUILD_TOKEN_ADDRESS.slice(-4)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a href={`https://sepolia.arbiscan.io/address/${CGUILD_ADDRESS}`} target="_blank" rel="noreferrer" className="text-amber-200/80 hover:text-[#d4af37] transition-colors flex items-center gap-1">
              <span>cGUILD: {CGUILD_ADDRESS.slice(0, 6)}...{CGUILD_ADDRESS.slice(-4)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a href={`https://sepolia.arbiscan.io/address/${GUILD_DAO_ADDRESS}`} target="_blank" rel="noreferrer" className="text-amber-200/80 hover:text-[#d4af37] transition-colors flex items-center gap-1">
              <span>GuildDAO: {GUILD_DAO_ADDRESS.slice(0, 6)}...{GUILD_DAO_ADDRESS.slice(-4)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Components View Switch */}
        {(activeView === 'all' || activeView === 'shield') && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <ShieldingLab />
          </motion.div>
        )}

        {(activeView === 'all' || activeView === 'proposals') && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <GovernanceFeed />
          </motion.div>
        )}

        {/* Whitelisted Telemetry Shield (Only renders if user is owner / deployer) */}
        <AdminConsole />
      </div>
    </div>
  );
}
