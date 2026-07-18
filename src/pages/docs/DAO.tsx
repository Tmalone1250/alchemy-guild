import { motion } from 'framer-motion';
import {
  Landmark,
  Shield,
  Flame,
  Droplets,
  Cpu,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  Server,
} from 'lucide-react';
import {
  GUILD_TOKEN_ADDRESS,
  CGUILD_ADDRESS,
  GUILD_DAO_ADDRESS,
  YIELD_VAULT_ADDRESS,
} from '@/config/contracts';

export default function DocsDAO() {
  return (
    <div className="space-y-10 text-foreground pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-mono text-[#d4af37] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Architecture & Mechanics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
          <Landmark className="w-8 h-8 sm:w-10 sm:h-10 text-[#d4af37]" />
          Confidential TEE Governance & POL Engine
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl">
          Discover how Alchemy Guild decouples transparent DEX trading from encrypted off-chain voting through <strong className="text-white">iExec Nox Intel TDX Enclaves</strong>, deflationary token sinks, and automated Protocol-Owned Liquidity (POL).
        </p>
      </motion.div>

      <div className="space-y-12">
        {/* Section 1: The Core Problem & Dual-Token Architecture */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-3 flex items-center gap-2 text-white">
            <Layers className="w-6 h-6 text-[#d4af37]" /> 1. The Dual-Token Architecture (`GUILD` vs `cGUILD`)
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Public governance tokens create a fundamental vulnerability in decentralized organizations: when user balances and vote weights are exposed on public block explorers, whales face front-running, bandwagoning bias, and governance retaliation. However, transparent Automated Market Makers (like Uniswap V3) require public, unencrypted tokens (`ERC20`) to execute swaps.
          </p>
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            <div className="p-6 rounded-xl border border-white/10 bg-card/60 space-y-3">
              <div className="flex items-center gap-2 text-[#d4af37] font-mono font-bold text-base">
                <Unlock className="w-5 h-5" /> Public GUILD Token (`ERC20`)
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fixed 100,000,000 total supply deployed on Arbitrum Sepolia (`chainId: 421614`). Freely tradable on Uniswap V3, used for liquidity pairs and treasury reserves. Completely transparent for on-chain DeFi composability.
              </p>
              <div className="text-xs font-mono pt-1 text-amber-200/60">
                Address: <code className="text-white">{GUILD_TOKEN_ADDRESS}</code>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-[#d4af37]/30 bg-[#050308] shadow-[0_0_20px_rgba(212,175,55,0.06)] space-y-3">
              <div className="flex items-center gap-2 text-[#d4af37] font-mono font-bold text-base">
                <Lock className="w-5 h-5" /> Confidential cGUILD (`ERC7984`)
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Encrypted confidential governance wrapper powered by <strong className="text-white">iExec Nox</strong>. Users shield public <code className="text-[#d4af37]">GUILD</code> into encrypted <code className="text-[#d4af37]">euint256</code> handles inside secure hardware enclaves to submit proposals and cast votes privately.
              </p>
              <div className="text-xs font-mono pt-1 text-amber-200/60">
                Address: <code className="text-white">{CGUILD_ADDRESS}</code>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Deflationary Token Burn Dynamics */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-3 flex items-center gap-2 text-white">
            <Flame className="w-6 h-6 text-rose-400" /> 2. Deflationary Governance Tokenomics
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            To prevent spam proposals and eliminate lazy voting, every governance action in Alchemy Guild is strictly <strong className="text-white">pay-to-play and deflationary</strong>. When you interact with <code className="text-white">GuildDAO.sol</code>, tokens are not staked or locked — they are permanently destroyed inside <code className="text-white">cGUILD.sol</code> via <code className="text-rose-300">underlying.burn(amount)</code>.
          </p>

          {/* Mathematical Formula Card: Token Burn Dynamics */}
          <div className="rounded-2xl bg-black/90 border border-[#d4af37]/30 p-6 sm:p-8 relative overflow-hidden shadow-lg group hover:border-[#d4af37]/60 transition-colors my-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-mono font-bold uppercase tracking-widest text-[#d4af37] flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-400" /> Token Supply Reduction Formula (S(t))
              </span>
              <span className="text-xs font-mono bg-rose-500/15 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30 font-bold">
                Deflationary Sink
              </span>
            </div>

            <div className="bg-[#050308] border border-white/10 rounded-xl p-5 font-mono text-center my-4 text-base sm:text-lg text-amber-200/90 shadow-inner overflow-x-auto">
              <code>{"S(t) = S(0) - sum(C_prop + C_vote)"}</code>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-xs sm:text-sm text-muted-foreground">
              <div className="bg-black/60 p-4 rounded-xl border border-white/5 space-y-1">
                <div className="text-white font-bold flex items-center justify-between">
                  <span>Proposal Creation Threshold (`C_prop`)</span>
                  <span className="text-[#d4af37] font-mono">500 cGUILD</span>
                </div>
                <p className="text-xs text-muted-foreground/80">
                  Enforced by <code className="text-white">PROPOSAL_THRESHOLD = 500 * 10^18</code>. Submitting a proposal burns 500 cGUILD instantaneously from your confidential handle.
                </p>
              </div>

              <div className="bg-black/60 p-4 rounded-xl border border-white/5 space-y-1">
                <div className="text-white font-bold flex items-center justify-between">
                  <span>Council Voting Cost (`C_vote`)</span>
                  <span className="text-[#d4af37] font-mono">10 cGUILD</span>
                </div>
                <p className="text-xs text-muted-foreground/80">
                  Enforced by <code className="text-white">VOTE_COST = 10 * 10^18</code>. Casting a YES or NO vote burns exactly 10 cGUILD per vote cast.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Phase 1 POL Growth Engine & Circular Initialization */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-3 flex items-center gap-2 text-white">
            <Droplets className="w-6 h-6 text-cyan-400" /> 3. Phase 1 POL Growth Engine & Circular Initialization
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            While 90% of yield generated by our Uniswap V3 Yield Vault is distributed to stakers and 7% goes to the sustainable gas paymaster, the remaining <strong className="text-white">3% is dedicated to bootstrapping Protocol-Owned Liquidity (POL)</strong>.
          </p>

          {/* Mathematical Formula Card: POL Growth */}
          <div className="rounded-2xl bg-black/90 border border-cyan-500/30 p-6 sm:p-8 relative overflow-hidden shadow-lg group hover:border-cyan-500/60 transition-colors my-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-mono font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-400" /> POL Liquidity Injection Formula (ΔL_POL)
              </span>
              <span className="text-xs font-mono bg-cyan-500/15 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30 font-bold">
                Aggressive Bootstrapping
              </span>
            </div>

            <div className="bg-[#050308] border border-white/10 rounded-xl p-5 font-mono text-center my-4 text-base sm:text-lg text-cyan-200/90 shadow-inner overflow-x-auto">
              <code>{"ΔL_POL = 0.03 * ΔY_USDC * Pair(WETH, GUILD)"}</code>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-muted-foreground pt-2">
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <h4 className="font-bold text-white mb-1">Solving the Uniswap V3 Circular Initialization Issue:</h4>
                <p className="text-xs leading-relaxed text-cyan-100/80">
                  Because a Uniswap V3 position NFT (<code className="text-white">sPolPositionId</code>) cannot be minted until a pool actually exists, attempting to mint during initial contract deployment causes a circular initialization revert. To solve this securely and pragmatically, <code className="text-white">YieldVault.sol</code> allows the 3% POL tax to safely accumulate in WETH inside the contract's balance before <code className="text-white">sPolPositionId</code> is set (`require(fee0 &gt;= yieldThreshold)`). Once the pool is created and <code className="text-white">setGuildTokenAndPolPosition()</code> is invoked, the very next harvest sweeps the entire accumulated WETH buffer into the pool in a single massive transaction!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: O(1) Flat-Gas AI Enclave Access Key Sharing */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-3 flex items-center gap-2 text-white">
            <Cpu className="w-6 h-6 text-amber-400" /> 4. O(1) Flat-Gas AI Enclave Access (`Leno AI Integration`)
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            In standard confidential voting setups, granting an external AI agent or sentiment analyzer permission to read vote tallies requires iterating over every individual vote handle (`bytes32[] voteHandles`) and calling `allow(voteHandle, agentAddress)`. On EVM chains, this loop consumes linear gas (<code className="text-white font-mono">O(N)</code>), causing transactions to revert due to block gas limits if a proposal receives thousands of votes.
          </p>

          <div className="p-6 rounded-2xl bg-[#050308] border border-[#d4af37]/40 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-bold text-[#d4af37] flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-300" /> The Master Access Key Optimization (`proposalAccessKeys`)
              </span>
              <span className="text-xs font-mono bg-emerald-500/15 text-emerald-300 px-3 py-1 rounded border border-emerald-500/30">
                ~10,035 Gas Units Flat
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              When a proposal is created, <code className="text-white">cGUILD.createProposalKey(proposalId)</code> generates an encrypted <strong className="text-white">Proposal-Level Master Access Key</strong> stored in <code className="text-amber-300">proposalAccessKeys[proposalId]</code>. When <code className="text-[#d4af37]">grantAgentViewingRights(agent, proposalId)</code> is called, the contract delegates access to this single master key in exactly <strong className="text-emerald-400">1 transaction (O(1) constant gas)</strong>.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Authorized <strong className="text-white">Leno AI Agents</strong> running inside their own secure hardware enclaves can use this native cryptographic pass to decrypt vote attributes within memory isolation, running off-chain sentiment analysis and forecasting without revealing raw voter distributions to public block explorers!
            </p>
          </div>
        </section>

        {/* Section 5: Intel TDX Attestation & ECDSA Hardware Proofs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b border-border pb-3 flex items-center gap-2 text-white">
            <Server className="w-6 h-6 text-emerald-400" /> 5. Intel TDX Enclave Attestation & Cryptographic Proofs
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            How can the smart contract trust off-chain TEE execution results? When the voting period expires, the TEE runner calculates the final tally inside Intel TDX hardware isolation and invokes <code className="text-white">executeProposalResult(proposalId, passed, totalFor, totalAgainst, teeProof)</code>.
          </p>
          <div className="bg-black/80 rounded-xl p-5 border border-white/10 space-y-3 font-mono text-xs">
            <div className="text-emerald-400 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Cryptographic Verification (`_verifyTeeProof`)
            </div>
            <p className="text-muted-foreground leading-relaxed font-sans">
              The internal `_verifyTeeProof` function packs `(proposalId, passed, totalFor, totalAgainst, chainId, address(this))` into an Ethereum Signed Message (`\x19Ethereum Signed Message:\n32`) and executes `ecrecover(messageHash, v, r, s)`. If and only if the recovered signer exactly matches the authorized <code className="text-[#d4af37]">teeRunnerAddress</code> DCAP-attested hardware enclave, the proposal resolution is finalized on-chain!
            </p>
          </div>
        </section>

        {/* Section 6: Verified Sepolia Contract Matrix */}
        <section className="space-y-4 pt-4">
          <h2 className="text-2xl font-bold border-b border-border pb-3 text-white">
            Arbitrum Sepolia Deployed Contract Architecture
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <a href={`https://sepolia.arbiscan.io/address/${GUILD_TOKEN_ADDRESS}`} target="_blank" rel="noreferrer" className="p-4 rounded-xl bg-black/60 border border-white/10 hover:border-[#d4af37]/60 transition-all flex items-center justify-between group">
              <div>
                <div className="text-white font-bold group-hover:text-[#d4af37] transition-colors">GuildToken.sol (`ERC20`)</div>
                <div className="text-muted-foreground text-[11px] mt-1 truncate">{GUILD_TOKEN_ADDRESS}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#d4af37]" />
            </a>

            <a href={`https://sepolia.arbiscan.io/address/${CGUILD_ADDRESS}`} target="_blank" rel="noreferrer" className="p-4 rounded-xl bg-black/60 border border-white/10 hover:border-[#d4af37]/60 transition-all flex items-center justify-between group">
              <div>
                <div className="text-white font-bold group-hover:text-[#d4af37] transition-colors">cGUILD.sol (`ERC7984` Nox)</div>
                <div className="text-muted-foreground text-[11px] mt-1 truncate">{CGUILD_ADDRESS}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#d4af37]" />
            </a>

            <a href={`https://sepolia.arbiscan.io/address/${GUILD_DAO_ADDRESS}`} target="_blank" rel="noreferrer" className="p-4 rounded-xl bg-black/60 border border-white/10 hover:border-[#d4af37]/60 transition-all flex items-center justify-between group">
              <div>
                <div className="text-white font-bold group-hover:text-[#d4af37] transition-colors">GuildDAO.sol (`Governance`)</div>
                <div className="text-muted-foreground text-[11px] mt-1 truncate">{GUILD_DAO_ADDRESS}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#d4af37]" />
            </a>

            <a href={`https://sepolia.arbiscan.io/address/${YIELD_VAULT_ADDRESS}`} target="_blank" rel="noreferrer" className="p-4 rounded-xl bg-black/60 border border-white/10 hover:border-cyan-500/60 transition-all flex items-center justify-between group">
              <div>
                <div className="text-white font-bold group-hover:text-cyan-400 transition-colors">YieldVault.sol (`POL Engine`)</div>
                <div className="text-muted-foreground text-[11px] mt-1 truncate">{YIELD_VAULT_ADDRESS}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
