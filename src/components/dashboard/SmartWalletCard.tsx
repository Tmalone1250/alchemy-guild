import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSmartAccount } from '@/hooks/useSmartAccount';
import { useBalance, useSendTransaction, useAccount } from 'wagmi';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { parseEther, formatEther, encodeFunctionData, parseUnits, type Hex } from 'viem';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/utils';
import { SEPOLIA_CHAIN, CONTRACTS } from '@/config/contracts';
import { createSmartAccountClient } from 'permissionless';
import { useReadContract } from 'wagmi';
import { http } from 'viem';
import { sepolia } from 'viem/chains';
import { pimlicoClient } from '@/config/pimlico';

export function SmartWalletCard() {
    const { smartAccountAddress, isReady, smartAccountClient } = useSmartAccount();
    const { address: eoaAddress } = useAccount();

    const { data: balance, refetch: refetchBalance } = useBalance({
        address: smartAccountAddress,
        query: {
            enabled: !!smartAccountAddress,
            refetchInterval: 5000,
        }
    });

    const { data: usdcBalance } = useReadContract({
        address: CONTRACTS.USDC.address,
        abi: [{
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
        }] as const,
        functionName: 'balanceOf',
        args: smartAccountAddress ? [smartAccountAddress] : undefined,
        query: {
            enabled: !!smartAccountAddress,
            refetchInterval: 5000,
        }
    });

    const { sendTransactionAsync, isPending: isDepositPending } = useSendTransaction();

    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
    const [token, setToken] = useState<'ETH' | 'USDC'>('ETH');
    const [copied, setCopied] = useState(false);
    const [isWithdrawPending, setIsWithdrawPending] = useState(false);

    const handleCopy = () => {
        if (smartAccountAddress) {
            navigator.clipboard.writeText(smartAccountAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Address copied to clipboard');
        }
    };

    const handleAction = async () => {
        if (!amount || !smartAccountAddress) return;

        try {
            const weiAmount = parseEther(amount);

            if (mode === 'deposit') {
                if (!eoaAddress) {
                    toast.error('Please connect your wallet first');
                    return;
                }
                toast.loading('Confirm deposit in your wallet...', { id: 'wallet-action' });
                const hash = await sendTransactionAsync({
                    to: smartAccountAddress,
                    value: weiAmount,
                });
                toast.success('Deposit initiated! Funds will arrive shortly.', { id: 'wallet-action' });
                setAmount('');
            } else {
                // Withdraw logic
                if (!smartAccountClient) return;
                if (!eoaAddress) {
                    toast.error('No destination address (EOA) found.');
                    return;
                }

                setIsWithdrawPending(true);
                toast.loading('Processing withdrawal from Smart Account...', { id: 'wallet-action' });

                // Create a temporary client WITHOUT Paymaster for withdrawals (User pays gas)
                const withdrawalClient = createSmartAccountClient({
                    account: smartAccountClient.account,
                    chain: sepolia,
                    bundlerTransport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`),
                    userOperation: {
                        estimateFeesPerGas: async () => {
                            return (await pimlicoClient.getUserOperationGasPrice()).fast;
                        }
                    }
                });

                let txHash;
                if (token === 'ETH') {
                    // Send ETH from Smart Account to EOA (Self-Funded Gas)
                    txHash = await withdrawalClient.sendTransaction({
                        to: eoaAddress,
                        value: weiAmount,
                        data: '0x'
                    } as any);
                } else {
                    // Send USDC
                    // 1. Check if amount is valid
                    if (!amount || isNaN(Number(amount))) throw new Error("Invalid amount");

                    // 2. Encode ERC20 transfer
                    // USDC has 6 decimals
                    const usdcAmount = parseUnits(amount, 6);

                    const data = encodeFunctionData({
                        abi: [{
                            name: 'transfer',
                            type: 'function',
                            inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
                            outputs: [{ name: '', type: 'bool' }]
                        }],
                        functionName: 'transfer',
                        args: [eoaAddress, usdcAmount]
                    });

                    txHash = await withdrawalClient.sendTransaction({
                        to: CONTRACTS.USDC.address,
                        value: 0n,
                        data: data as Hex
                    } as any); // Type assertion to bypass strict KZG check on Sepolia config
                }

                toast.success('Withdrawal successful!', { id: 'wallet-action' });
                setAmount('');
                // Refresh balance after short delay
                setTimeout(() => refetchBalance(), 2000);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(`Transaction failed: ${err.message?.slice(0, 50)}...`, { id: 'wallet-action' });
        } finally {
            setIsWithdrawPending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="w-24 h-24 text-primary" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Guild Bank</h3>
                        <p className="text-sm text-muted-foreground">Smart Account</p>
                    </div>
                </div>

                {/* Balance Display */}
                <div className="mb-6 p-4 rounded-xl bg-background/50 border border-border">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Total Balance</div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                                {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} ETH
                            </div>
                            <div className="text-lg font-semibold text-foreground/80 mt-1">
                                {usdcBalance ? (Number(usdcBalance) / 1e6).toFixed(2) : '0.00'} USDC
                            </div>
                        </div>
                    </div>

                    {smartAccountAddress && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground bg-black/20 p-2 rounded-lg w-fit">
                            <span className="font-mono">{shortenAddress(smartAccountAddress)}</span>
                            <button onClick={handleCopy} className="hover:text-primary transition-colors">
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <a
                                href={`${SEPOLIA_CHAIN.blockExplorers.default.url}/address/${smartAccountAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Actions Tabs */}
                <div className="flex bg-background/50 rounded-lg p-1 mb-4">
                    <button
                        onClick={() => {
                            setMode('deposit');
                            setToken('ETH');
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'deposit'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <ArrowDownCircle className="w-4 h-4" /> Deposit
                    </button>
                    <button
                        onClick={() => setMode('withdraw')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'withdraw'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <ArrowUpCircle className="w-4 h-4" /> Withdraw
                    </button>
                </div>

                {/* Input Area */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="text-muted-foreground">Balance: {token === 'ETH'
                                ? (balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.00')
                                : (usdcBalance ? (Number(usdcBalance) / 1e6).toFixed(2) : '0.00')} {token}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-background/50 font-mono"
                                />
                            </div>
                            <div className="w-[100px]">
                                <Select value={token} onValueChange={(v: 'ETH' | 'USDC') => setToken(v)}>
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ETH">ETH</SelectItem>
                                        {mode === 'withdraw' && <SelectItem value="USDC">USDC</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleAction}
                        disabled={!amount || isDepositPending || isWithdrawPending}
                    >
                        {mode === 'deposit' ? 'Deposit to Bank' : 'Withdraw from Bank'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        {mode === 'deposit'
                            ? 'Funds are sent from your main wallet to your Guild Bank.'
                            : 'Funds are sent from your Guild Bank back to your main wallet.'}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
