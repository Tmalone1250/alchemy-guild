import { useState } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatEther, parseEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { Shield, Lock, Unlock, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  GUILD_TOKEN_ADDRESS,
  CGUILD_ADDRESS,
} from '@/config/contracts';
import { GUILD_TOKEN_ABI, CGUILD_ABI } from '@/config/abis';
import { useSmartAccount } from '@/hooks/useSmartAccount';

export function ShieldingLab() {
  const { address, isConnected } = useAccount();
  const { smartAccountClient, smartAccountAddress, isReady } = useSmartAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<'shield' | 'unshield'>('shield');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'idle' | 'approving' | 'shielding' | 'unshielding' | 'success'>('idle');

  // ── Read: Public GUILD Balance of Smart Account ──────────────────────────
  const { data: publicBalanceData, refetch: refetchPublic } = useReadContract({
    address: GUILD_TOKEN_ADDRESS,
    abi: GUILD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: smartAccountAddress ? [smartAccountAddress] : undefined,
    query: { enabled: !!smartAccountAddress },
  });

  // ── Read: Confidential cGUILD handle of Smart Account ───────────────────
  const { data: cGuildHandleData, refetch: refetchPrivate } = useReadContract({
    address: CGUILD_ADDRESS,
    abi: CGUILD_ABI,
    functionName: 'balanceOf',
    args: smartAccountAddress ? [smartAccountAddress] : undefined,
    query: { enabled: !!smartAccountAddress },
  });

  // ── Read: Allowance that the Smart Account has granted cGUILD ───────────
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: GUILD_TOKEN_ADDRESS,
    abi: GUILD_TOKEN_ABI,
    functionName: 'allowance',
    args: smartAccountAddress ? [smartAccountAddress, CGUILD_ADDRESS] : undefined,
    query: { enabled: !!smartAccountAddress && mode === 'shield' },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  const invalidateAll = () => {
    // Bust wagmi's TanStack Query cache so balances re-fetch from chain
    queryClient.invalidateQueries();
  };

  const publicBalanceFormatted = publicBalanceData
    ? parseFloat(formatEther(publicBalanceData as bigint)).toFixed(4)
    : '0.0000';

  /**
   * cGUILD.balanceOf returns bytes32 (an iExec Nox encrypted handle).
   * A zero bytes32 (0x000...000) means no handle exists yet.
   * Any non-zero bytes32 means the user has an active confidential shield.
   */
  const formatHandleDisplay = (data: unknown): { label: string; active: boolean } => {
    if (!data) return { label: 'No Handle (Unshielded)', active: false };
    // viem decodes bytes32 as a 0x-prefixed hex string
    const hex = typeof data === 'string' ? data : null;
    if (hex === null) return { label: 'No Handle (Unshielded)', active: false };
    const isZero = /^0x0+$/.test(hex);
    if (isZero) return { label: 'No Handle (Unshielded)', active: false };
    return { label: `Active TEE Handle [${hex.slice(2, 10)}…]`, active: true };
  };

  const handleDisplay = formatHandleDisplay(cGuildHandleData);

  // ── Core: shield after approve has confirmed ─────────────────────────────
  const execShield = async (parsedAmount: bigint) => {
    if (!smartAccountClient) throw new Error('Smart account not ready');
    setStep('shielding');
    const txHash = await smartAccountClient.writeContract({
      address: CGUILD_ADDRESS,
      abi: CGUILD_ABI,
      functionName: 'shield',
      args: [parsedAmount],
      chain: arbitrumSepolia,
      account: smartAccountClient.account,
    });
    toast.loading('Shielding into confidential enclave…', { id: 'shield-tx' });
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== 'success') throw new Error('Shield transaction reverted');
    toast.success(`Tokens shielded! TX: ${txHash.slice(0, 10)}…`, { id: 'shield-tx' });
    setStep('success');
    setAmount('');
    invalidateAll();
  };

  // ── Main handler ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!isReady || !smartAccountClient) {
      toast.error('Smart account not ready yet — please wait a moment');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const parsedAmount = parseEther(amount);

    try {
      if (mode === 'shield') {
        const currentAllowance = (allowanceData as bigint) || 0n;

        if (currentAllowance < parsedAmount) {
          // ── Step 1: Approve ────────────────────────────────────────────
          setStep('approving');
          const approveTx = await smartAccountClient.writeContract({
            address: GUILD_TOKEN_ADDRESS,
            abi: GUILD_TOKEN_ABI,
            functionName: 'approve',
            args: [CGUILD_ADDRESS, parsedAmount],
            chain: arbitrumSepolia,
            account: smartAccountClient.account,
          });
          toast.loading('Approving GUILD tokens…', { id: 'approve-tx' });
          const approveReceipt = await publicClient!.waitForTransactionReceipt({ hash: approveTx });
          if (approveReceipt.status !== 'success') throw new Error('Approval transaction reverted');
          toast.success('GUILD tokens approved!', { id: 'approve-tx' });
          invalidateAll();
        }

        // ── Step 2: Shield ─────────────────────────────────────────────
        await execShield(parsedAmount);

      } else {
        // ── Unshield ────────────────────────────────────────────────────
        setStep('unshielding');
        const txHash = await smartAccountClient.writeContract({
          address: CGUILD_ADDRESS,
          abi: CGUILD_ABI,
          functionName: 'unshield',
          args: [parsedAmount],
          chain: arbitrumSepolia,
          account: smartAccountClient.account,
        });
        toast.loading('Unshielding back to public GUILD…', { id: 'unshield-tx' });
        const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== 'success') throw new Error('Unshield transaction reverted');
        toast.success(`Unshielded! TX: ${txHash.slice(0, 10)}…`, { id: 'unshield-tx' });
        setStep('success');
        setAmount('');
        invalidateAll();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.shortMessage || err.message || 'Transaction failed');
      setStep('idle');
    }
  };

  const isProcessing = step === 'approving' || step === 'shielding' || step === 'unshielding';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#050308] border border-[#d4af37]/30 hover:border-[#d4af37]/60 transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.08)] p-6 md:p-8">
      {/* Glow background accent */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[#d4af37]/20 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-black border border-[#d4af37]/40 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-200 via-[#d4af37] to-amber-500 bg-clip-text text-transparent">
              The Shielding Lab
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              iExec Nox Confidential TEE Governance Wrapper (`ERC7984`)
            </p>
          </div>
        </div>

        {/* Switcher */}
        <div className="flex items-center bg-black/80 border border-[#d4af37]/30 rounded-xl p-1 w-fit shadow-inner">
          <button
            onClick={() => { setMode('shield'); setStep('idle'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
              mode === 'shield'
                ? 'bg-gradient-to-r from-[#d4af37] to-amber-600 text-black shadow-md font-bold'
                : 'text-muted-foreground hover:text-[#d4af37]'
            }`}
          >
            <Lock className="w-4 h-4" />
            Shield (Lock GUILD)
          </button>
          <button
            onClick={() => { setMode('unshield'); setStep('idle'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
              mode === 'unshield'
                ? 'bg-gradient-to-r from-[#d4af37] to-amber-600 text-black shadow-md font-bold'
                : 'text-muted-foreground hover:text-[#d4af37]'
            }`}
          >
            <Unlock className="w-4 h-4" />
            Unshield (Unlock GUILD)
          </button>
        </div>
      </div>

      {/* Balances Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-black/60 rounded-xl p-4 border border-white/10 flex flex-col justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
            Smart Account GUILD Balance
          </span>
          <div className="text-xl md:text-2xl font-bold font-mono text-white mt-1">
            {publicBalanceFormatted} <span className="text-sm text-[#d4af37]">GUILD</span>
          </div>
        </div>
        <div className="bg-black/60 rounded-xl p-4 border border-[#d4af37]/30 flex flex-col justify-between shadow-[inset_0_0_15px_rgba(212,175,55,0.05)]">
          <span className="text-xs text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Confidential cGUILD Status
          </span>
          <div className={`text-sm md:text-base font-bold font-mono mt-1 truncate ${
            handleDisplay.active ? 'text-emerald-400' : 'text-amber-200/40'
          }`}>
            {handleDisplay.active && <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />}
            {handleDisplay.label}
          </div>
        </div>
      </div>

      {/* Action Box */}
      <div className="space-y-4">
        <div className="bg-black/80 rounded-xl p-4 border border-[#d4af37]/20">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              {mode === 'shield' ? 'Amount to Shield (Lock into cGUILD)' : 'Amount to Unshield (Withdraw to GUILD)'}
            </label>
            {mode === 'shield' && (
              <button
                onClick={() => setAmount(publicBalanceFormatted)}
                className="text-xs text-[#d4af37] hover:underline font-mono"
              >
                MAX ({publicBalanceFormatted})
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setStep('idle'); }}
              disabled={isProcessing}
              className="bg-transparent text-2xl md:text-3xl font-mono text-white placeholder:text-muted-foreground/30 focus:outline-none w-full"
            />
            <div className="flex items-center gap-2 bg-[#d4af37]/10 border border-[#d4af37]/30 px-3 py-1.5 rounded-lg">
              <span className="font-bold font-mono text-[#d4af37] text-sm">
                {mode === 'shield' ? 'GUILD' : 'cGUILD'}
              </span>
            </div>
          </div>
        </div>

        {/* Educational Banner */}
        <div className="bg-black/40 rounded-xl p-3.5 border border-white/5 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            {mode === 'shield' ? (
              <>
                <strong className="text-white">Confidential Enclave Wrapping:</strong> Locking public <code className="text-[#d4af37]">GUILD</code> mints an encrypted <code className="text-[#d4af37]">euint256</code> handle in <code className="text-white">cGUILD.sol</code> (`Nox.allow(...)`). This handle allows you to submit proposals and cast votes completely hidden from public block explorers.
              </>
            ) : (
              <>
                <strong className="text-white">Plaintext Unshielding:</strong> Burning your confidential <code className="text-[#d4af37]">cGUILD</code> handle inside the TEE enclave unlocks exact 1:1 public <code className="text-[#d4af37]">GUILD</code> tokens to your Smart Account on Arbitrum Sepolia.
              </>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!isConnected || !isReady || isProcessing || !amount || Number(amount) <= 0}
          className="w-full py-4 rounded-xl font-bold font-mono uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-400 via-[#d4af37] to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>
                {step === 'approving' && 'Approving GUILD…'}
                {step === 'shielding' && 'Shielding into Enclave…'}
                {step === 'unshielding' && 'Unshielding to Public…'}
              </span>
            </>
          ) : step === 'success' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-black" />
              <span>Operation Complete</span>
            </>
          ) : mode === 'shield' ? (
            <>
              <Lock className="w-5 h-5" />
              <span>Shield to Confidential cGUILD</span>
            </>
          ) : (
            <>
              <Unlock className="w-5 h-5" />
              <span>Unshield to Public GUILD</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
