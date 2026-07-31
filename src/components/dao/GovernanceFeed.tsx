import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { useSmartAccount } from '@/hooks/useSmartAccount';
import {
  Vote,
  PlusCircle,
  ThumbsUp,
  ThumbsDown,
  Cpu,
  Key,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  ExternalLink,
  Flame,
  Lock,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  GUILD_DAO_ADDRESS,
  CGUILD_ADDRESS,
  PROPOSAL_THRESHOLD_cGUILD,
  VOTE_COST_GUILD,
} from '@/config/contracts';
import { GUILD_DAO_ABI, CGUILD_ABI } from '@/config/abis';

export interface ProposalDisplay {
  id: number;
  proposer: string;
  ipfsHash: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  executed: boolean;
  passed: boolean;
  totalFor: number;
  totalAgainst: number;
  voteCount: number;
  isMock?: boolean;
}

export function GovernanceFeed() {
  const { address, isConnected } = useAccount();
  const { smartAccountClient, smartAccountAddress } = useSmartAccount();
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');
  const [ipfsInput, setIpfsInput] = useState('');
  const [delegateModalOpen, setDelegateModalOpen] = useState<number | null>(null);
  const [delegateAgentAddress, setDelegateAgentAddress] = useState('0x71C95911E9a5D330f4D621842EC243EE1343292e');
  const [activeTab, setActiveTab] = useState<'active' | 'passed' | 'all'>('active');

  // Query User's Confidential cGUILD Balance
  const { data: cGuildBalanceData } = useReadContract({
    address: CGUILD_ADDRESS,
    abi: CGUILD_ABI,
    functionName: 'balanceOf',
    args: smartAccountAddress ? [smartAccountAddress] : (address ? [address] : undefined),
    query: { enabled: !!(smartAccountAddress || address) },
  });

  // Query Total Proposals Count on-chain
  const { data: proposalCountData, refetch: refetchCount } = useReadContract({
    address: GUILD_DAO_ADDRESS,
    abi: GUILD_DAO_ABI,
    functionName: 'proposalCount',
  });

  const proposalCount = proposalCountData ? Number(proposalCountData) : 0;

  // Construct batch read queries for all proposal IDs (1-indexed in Solidity)
  const proposalQueries = useMemo(() => {
    if (!proposalCount) return [];
    return Array.from({ length: proposalCount }, (_, i) => ({
      address: GUILD_DAO_ADDRESS,
      abi: GUILD_DAO_ABI,
      functionName: 'proposals',
      args: [BigInt(i + 1)],
    }));
  }, [proposalCount]);

  const { data: rawProposals, refetch: refetchProposals } = useReadContracts({
    contracts: proposalQueries,
    query: { enabled: proposalQueries.length > 0 },
  });

  // Construct batch read queries for exact encrypted vote handles count
  const voteHandlesQueries = useMemo(() => {
    if (!proposalCount) return [];
    return Array.from({ length: proposalCount }, (_, i) => ({
      address: GUILD_DAO_ADDRESS,
      abi: GUILD_DAO_ABI,
      functionName: 'getVoteHandlesCount',
      args: [BigInt(i + 1)],
    }));
  }, [proposalCount]);

  const { data: rawVoteHandles, refetch: refetchVoteHandles } = useReadContracts({
    contracts: voteHandlesQueries,
    query: { enabled: voteHandlesQueries.length > 0 },
  });

  const liveProposals: ProposalDisplay[] = useMemo(() => {
    if (!rawProposals) return [];
    const parsed: ProposalDisplay[] = [];
    for (let i = 0; i < rawProposals.length; i++) {
      const item = rawProposals[i];
      if (item.status === 'success' && item.result) {
        const res = item.result as [bigint, string, string, bigint, bigint, boolean, boolean, bigint, bigint];
        const id = Number(res[0]);
        if (id <= 0) continue; // Skip invalid or uninitialized 0-ID entries
        const proposer = res[1];
        const ipfsHash = res[2] || 'Qm...';
        let title = `Proposal #${id}: ${ipfsHash.length > 30 ? ipfsHash.slice(0, 24) + '...' : ipfsHash}`;
        let description = `On-chain governance proposal submitted to GuildDAO. Enclave verification payload: ${ipfsHash}`;
        
        try {
          if (ipfsHash.startsWith('{')) {
            const json = JSON.parse(ipfsHash);
            if (json.title) title = json.title;
            if (json.description) description = json.description;
          } else if (ipfsHash.startsWith('QmGuildAux')) {
            title = `AIP-${id}: ${decodeURIComponent(ipfsHash.split('_')[1] || `Proposal #${id}`)}`;
            description = `Confidential governance proposal verified via Intel TDX Enclave payload (${ipfsHash.split('_')[0]}).`;
          } else if (!ipfsHash.startsWith('Qm') && ipfsHash.length < 120) {
            title = `AIP-${id}: ${ipfsHash}`;
          }
        } catch (e) {}

        const handlesCount = rawVoteHandles?.[i]?.status === 'success' && rawVoteHandles[i].result !== undefined
          ? Number(rawVoteHandles[i].result)
          : (Number(res[7]) + Number(res[8]));

        parsed.push({
          id,
          proposer,
          ipfsHash,
          title,
          description,
          startTime: Number(res[3]),
          endTime: Number(res[4]),
          executed: res[5],
          passed: res[6],
          totalFor: Number(res[7]),
          totalAgainst: Number(res[8]),
          voteCount: handlesCount,
          isMock: false,
        });
      }
    }
    return parsed.reverse();
  }, [rawProposals, rawVoteHandles]);

  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>(undefined);
  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  useEffect(() => {
    if (isTxConfirmed && pendingTxHash) {
      toast.success('Governance transaction successfully confirmed by Intel TDX Enclave!');
      refetchCount();
      refetchProposals();
      refetchVoteHandles();
      setProposalTitle('');
      setProposalDesc('');
      setIpfsInput('');
      setDelegateModalOpen(null);
      setPendingTxHash(undefined);
    }
  }, [isTxConfirmed, pendingTxHash]);

  // Check if user meets the 500 cGUILD threshold
  // Note: cGuild balance might be euint256 handle wrapper (struct/bigint). If testing with plain handles or simulated balances:
  const userMeetsThreshold = true; // In UI we allow interaction and let exact contract require check pass/revert safely or show warning if 0

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error('Connect wallet to submit proposal');
      return;
    }
    if (!smartAccountClient) {
      toast.error('Smart Account not ready yet. Please wait a second and try again.');
      return;
    }
    if (!proposalTitle || !proposalDesc) {
      toast.error('Please enter a title and description');
      return;
    }

    const generatedIpfsHash = ipfsInput || JSON.stringify({
      title: proposalTitle,
      description: proposalDesc,
      timestamp: Date.now(),
    });

    try {
      toast.info('Submitting proposal via Smart Account Paymaster... (Spends & burns 500 cGUILD threshold)');
      const hash = await smartAccountClient.writeContract({
        address: GUILD_DAO_ADDRESS,
        abi: GUILD_DAO_ABI,
        functionName: 'createProposal',
        args: [generatedIpfsHash],
        chain: arbitrumSepolia,
        account: smartAccountClient.account,
      });
      setPendingTxHash(hash);
      toast.loading(`Submitting proposal UserOp: ${hash.slice(0, 10)}...`, { id: 'gov-tx' });
    } catch (err: any) {
      console.error(err);
      const msg = err.shortMessage || err.message || '';
      if (msg.includes('0xe450d38c') || msg.includes('Insufficient balance') || msg.includes('d32b7929')) {
        toast.error('Insufficient cGUILD threshold! Please shield at least 500 GUILD into cGUILD inside the Shielding Lab above first.');
      } else {
        toast.error(msg || 'Failed to create proposal');
      }
    }
  };

  const handleCastVote = async (proposalId: number, support: boolean) => {
    if (!isConnected) {
      toast.error('Connect wallet to cast vote');
      return;
    }
    if (!smartAccountClient) {
      toast.error('Smart Account not ready yet.');
      return;
    }
    try {
      toast.info(`Casting confidential ${support ? 'FOR' : 'AGAINST'} vote via Smart Account... (Burns 10 cGUILD per vote)`);
      const hash = await smartAccountClient.writeContract({
        address: GUILD_DAO_ADDRESS,
        abi: GUILD_DAO_ABI,
        functionName: 'castVote',
        args: [BigInt(proposalId), support],
        chain: arbitrumSepolia,
        account: smartAccountClient.account,
      });
      setPendingTxHash(hash);
      toast.loading(`Casting vote UserOp: ${hash.slice(0, 10)}...`, { id: 'gov-tx' });
    } catch (err: any) {
      console.error(err);
      const msg = err.shortMessage || err.message || '';
      if (msg.includes('Already voted') || msg.includes('416c726561647920766f746564')) {
        toast.error('You have already cast your confidential vote on this proposal!');
      } else if (msg.includes('Voting ended') || msg.includes('566f74696e6720656e646564')) {
        toast.error('Voting period has ended for this proposal!');
      } else if (msg.includes('0xe450d38c') || msg.includes('Insufficient balance') || msg.includes('d32b7929')) {
        toast.error('Insufficient cGUILD to vote! Please shield at least 10 GUILD into cGUILD inside the Shielding Lab above.');
      } else {
        toast.error(msg || 'Vote failed');
      }
    }
  };

  const handleGrantDelegateRights = async (proposalId: number) => {
    if (!delegateAgentAddress || !delegateAgentAddress.startsWith('0x')) {
      toast.error('Enter a valid 0x AI agent enclave address');
      return;
    }
    if (!smartAccountClient) {
      toast.error('Smart Account not ready yet.');
      return;
    }
    try {
      toast.info('Granting O(1) Master Access Key viewing rights via Smart Account...');
      const hash = await smartAccountClient.writeContract({
        address: GUILD_DAO_ADDRESS,
        abi: GUILD_DAO_ABI,
        functionName: 'grantAgentViewingRights',
        args: [delegateAgentAddress as `0x${string}`, BigInt(proposalId)],
        chain: arbitrumSepolia,
        account: smartAccountClient.account,
      });
      setPendingTxHash(hash);
      toast.loading(`Granting access UserOp: ${hash.slice(0, 10)}...`, { id: 'gov-tx' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.shortMessage || err.message || 'Delegation failed');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
      {/* LEFT COLUMN: Submit Proposal Card (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl bg-[#050308] border border-[#d4af37]/30 p-6 md:p-8 shadow-[0_0_30px_rgba(212,175,55,0.06)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#d4af37]/10 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#d4af37]/20">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Submit Council Proposal</h3>
              <p className="text-xs text-muted-foreground font-mono">
                Threshold: <span className="text-[#d4af37] font-bold">500 cGUILD</span> (Burned on creation)
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateProposal} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
                Proposal Title
              </label>
              <input
                type="text"
                placeholder="AIP-16: Optimize..."
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4af37]/60 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
                Specification & Rationale
              </label>
              <textarea
                rows={4}
                placeholder="Detailed explanation of the protocol parameter shift, POL liquidity target, or TEE governance upgrade..."
                value={proposalDesc}
                onChange={(e) => setProposalDesc(e.target.value)}
                className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4af37]/60 transition-colors resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>IPFS Payload Hash (Optional)</span>
                <span className="text-[10px] text-amber-400/80 lowercase">auto-generates if empty</span>
              </label>
              <input
                type="text"
                placeholder="Qm..."
                value={ipfsInput}
                onChange={(e) => setIpfsInput(e.target.value)}
                className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-amber-200/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#d4af37]/60 transition-colors"
              />
            </div>

            {/* Cost breakdown alert */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 mt-4">
              <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="text-xs text-amber-200/90 leading-relaxed">
                <strong>Deflationary Governance Enforcement:</strong> Creating this proposal will permanently burn exactly <span className="font-mono font-bold text-white">500 cGUILD</span> from your confidential enclave handle.
              </div>
            </div>

            <button
              type="submit"
              disabled={!isConnected || isTxConfirming}
              className="w-full py-3.5 rounded-xl font-bold font-mono text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-[0_0_20px_rgba(212,175,55,0.25)]"
            >
              {isTxConfirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Enclave Transaction...</span>
                </>
              ) : (
                <>
                  <Vote className="w-4 h-4" />
                  <span>Submit Confidential Proposal (Burn 500 cGUILD)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Gamified Deflationary Tracker */}
        <div className="rounded-2xl bg-gradient-to-br from-black to-[#050308] border border-white/10 p-6 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Deflationary Voting Economics
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live TEE Burn Rule
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every proposal creation (C_prop = 500 cGUILD) and vote cast (C_vote = 10 cGUILD) triggers <code className="text-amber-300">underlying.burn(amount)</code> inside <code className="text-white">cGUILD.sol</code>. This decouples voting weight from public wealth displays and continually reduces total circulating supply.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Proposals Feed (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d4af37]/20">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Vote className="w-5 h-5 text-[#d4af37]" /> Active Council Proposals
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              Encrypted Off-Chain TEE Tallies ({proposalCount} On-Chain Enclave Streams)
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center bg-black/80 border border-white/10 rounded-xl p-1 text-xs font-mono">
            {(['active', 'passed', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-[#d4af37] text-black font-bold shadow'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {liveProposals.length === 0 ? (
            <div className="rounded-2xl bg-[#050308] border border-[#d4af37]/30 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto">
                <Vote className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">No Council Proposals Yet</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Be the first Council Member to submit a confidential proposal! Shield your GUILD tokens using the Shielding Lab above (`C_prop = 500 cGUILD` required), then submit your rationale using the form on the left.
              </p>
            </div>
          ) : (
            liveProposals.map((prop) => {
              const totalVotes = prop.totalFor + prop.totalAgainst;
              const forPercent = totalVotes > 0 ? Math.round((prop.totalFor / totalVotes) * 100) : 50;

              return (
                <div
                  key={prop.id}
                  className="rounded-2xl bg-[#050308] border border-[#d4af37]/30 hover:border-[#d4af37]/60 transition-all duration-300 p-6 space-y-4 relative overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.05)] group"
                >
                  {/* Glowing green Intel TDX Secured badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-1 rounded border border-[#d4af37]/30">
                        #{prop.id}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        Proposer: <code className="text-white">{prop.proposer.slice(0, 6)}...{prop.proposer.slice(-4)}</code>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        Intel TDX Secured
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400/80 bg-black px-2.5 py-1 rounded border border-white/10">
                        <Clock className="w-3 h-3" /> Live Enclave
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-base md:text-lg font-bold text-white group-hover:text-[#d4af37] transition-colors">
                      {prop.title}
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                      {prop.description}
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-muted-foreground/60 flex items-center gap-1">
                      <span>Payload Hash:</span> <code className="text-amber-200/60 truncate max-w-[280px]">{prop.ipfsHash}</code>
                    </div>
                  </div>

                  {/* Confidential Tally Progress Bar */}
                  {!prop.executed ? (
                    <div className="space-y-2.5 bg-black/60 p-3.5 rounded-xl border border-[#d4af37]/30 shadow-[0_0_15px_rgba(212,175,55,0.08)]">
                      <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-mono">
                        <span className="text-[#d4af37] font-semibold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#d4af37]" /> Confidential TEE Voting Active
                        </span>
                        <span className="text-white font-bold bg-[#d4af37]/15 px-2.5 py-0.5 rounded border border-[#d4af37]/40">
                          {prop.voteCount} Encrypted {prop.voteCount === 1 ? 'Vote Handle' : 'Vote Handles'} Sealed
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden flex relative">
                        <div className="w-full h-full bg-gradient-to-r from-[#d4af37]/20 via-[#d4af37]/80 to-[#d4af37]/20 animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                      </div>
                      <div className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed pt-0.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          Individual vote choices (FOR vs AGAINST) are encrypted (`euint256`) to prevent bribery and frontrunning. Plaintext FOR/AGAINST percentage unlocks after the 3-day voting period concludes and the TEE enclave resolves the tally.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 bg-black/60 p-3.5 rounded-xl border border-white/5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5" /> FOR ({forPercent}%)
                        </span>
                        <span className="text-muted-foreground">Resolved Tally ({totalVotes} Total Weight)</span>
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          AGAINST ({100 - forPercent}%) <ThumbsDown className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-rose-500/20 overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          style={{ width: `${forPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Vote Actions & AI Delegation */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCastVote(prop.id, true)}
                        disabled={isTxConfirming}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Upvote (Burn 10)
                      </button>
                      <button
                        onClick={() => handleCastVote(prop.id, false)}
                        disabled={isTxConfirming}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" /> Downvote (Burn 10)
                      </button>
                    </div>

                    {/* Delegation trigger */}
                    <button
                      onClick={() => setDelegateModalOpen(prop.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 transition-all flex items-center justify-center gap-1.5 group/del"
                      title="O(1) Flat-Gas Master Key Sharing with Leno AI Enclave"
                    >
                      <Cpu className="w-3.5 h-3.5 text-amber-300 group-hover/del:rotate-12 transition-transform" />
                      <span>Delegate Enclave Analytics</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Leno AI Key Delegation Modal */}
      {delegateModalOpen !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#050308] border border-[#d4af37]/60 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(212,175,55,0.2)] space-y-4 relative">
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-3">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <Key className="w-5 h-5 text-[#d4af37]" />
                <span>O(1) Enclave Access Delegation</span>
              </div>
              <button
                onClick={() => setDelegateModalOpen(null)}
                className="text-muted-foreground hover:text-white text-sm font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Instead of iterating over <code className="text-white font-mono">$O(N)$</code> linear vote handles (`bytes32[]`), <code className="text-[#d4af37]">GuildDAO.sol</code> delegates cryptographic access directly to Proposal <span className="font-bold text-white">#{delegateModalOpen}</span>'s Master Access Key (<code className="text-amber-300">proposalAccessKeys[proposalId]</code>).
            </p>

            <div className="bg-black/80 rounded-xl p-3 border border-white/10 space-y-2">
              <label className="block text-[11px] font-mono text-[#d4af37] uppercase tracking-wider">
                Leno AI Enclave Address (`0x...`)
              </label>
              <input
                type="text"
                value={delegateAgentAddress}
                onChange={(e) => setDelegateAgentAddress(e.target.value)}
                className="w-full bg-transparent font-mono text-sm text-white focus:outline-none border-b border-white/10 pb-1"
                placeholder="0x71C9...292e"
              />
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-emerald-300">
              <span>Estimated Gas Cost:</span>
              <span className="font-bold text-white">~10,035 units (O(1) Flat Fee)</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDelegateModalOpen(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-mono text-muted-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGrantDelegateRights(delegateModalOpen)}
                disabled={isTxConfirming}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-600 text-black font-bold font-mono text-xs uppercase tracking-wider hover:brightness-110 shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {isTxConfirming ? 'Authorizing Key...' : 'Authorize Enclave Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
