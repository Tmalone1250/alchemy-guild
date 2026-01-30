import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSmartAccount } from '@/hooks/useSmartAccount';
import { useBalance, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Wallet } from 'lucide-react';

export function OnboardingModal() {
    const { smartAccountAddress, isReady } = useSmartAccount();
    const [isOpen, setIsOpen] = useState(false);

    const { data: balance, isLoading: isBalanceLoading } = useBalance({
        address: smartAccountAddress,
        query: {
            enabled: !!smartAccountAddress,
        }
    });

    const { sendTransactionAsync, isPending } = useSendTransaction();

    useEffect(() => {
        // Only show if ready, balance loaded, and balance < 0.002 ETH
        if (isReady && !isBalanceLoading && balance) {
            const minBalance = parseEther('0.002');
            if (balance.value < minBalance) {
                // Check if we already showed it this session to avoid annoyance? 
                // For now, always show if underfunded as they literally can't play.
                const hasSeenOnboarding = sessionStorage.getItem('hasSeenOnboarding');
                if (!hasSeenOnboarding) {
                    setIsOpen(true);
                }
            }
        }
    }, [isReady, balance, isBalanceLoading]);

    const handleDeposit = async () => {
        if (!smartAccountAddress) return;
        try {
            const hash = await sendTransactionAsync({
                to: smartAccountAddress,
                value: parseEther('0.002'), // Suggest 0.002 ETH for a good start
            });
            toast.success('Deposit initiated! Welcome to the Guild.');
            setIsOpen(false);
            sessionStorage.setItem('hasSeenOnboarding', 'true');
        } catch (err) {
            toast.error('Deposit failed. Please try again.');
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('hasSeenOnboarding', 'true');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Wallet className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">Activate Your Guild Bank</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        To start minting Elements and crafting, you need to deposit funds into your Smart Account.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm">
                        <div className="flex justify-between mb-2">
                            <span className="text-muted-foreground">Action Cost (Gas)</span>
                            <span className="text-green-500 font-medium">Free (Sponsored)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Protocol Fee</span>
                            <span>0.002 ETH</span>
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        We recommend depositing <strong>0.002 ETH</strong> to get started smoothly.
                    </p>
                </div>

                <DialogFooter className="flex-col gap-2 sm:gap-0">
                    <Button onClick={handleDeposit} disabled={isPending} className="w-full">
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                Deposit 0.002 ETH <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                    <Button variant="ghost" onClick={handleClose} className="w-full mt-2">
                        I'll do it later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
