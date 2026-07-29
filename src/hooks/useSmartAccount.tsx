import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { createSmartAccountClient, SmartAccountClient } from 'permissionless';
import { entryPoint07Address } from 'viem/account-abstraction';
import { pimlicoClient } from '../config/pimlico';
import { PAYMASTER_ADDRESS } from '../config/contracts';
import { http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

interface SmartAccountContextType {
    smartAccountClient: SmartAccountClient | null;
    smartAccountAddress: `0x${string}` | null;
    isReady: boolean;
}

const SmartAccountContext = createContext<SmartAccountContextType>({
    smartAccountClient: null,
    smartAccountAddress: null,
    isReady: false,
});

export function SmartAccountProvider({ children }: { children: ReactNode }) {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    
    const [smartAccountClient, setSmartAccountClient] = useState<SmartAccountClient | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [smartAccountAddress, setSmartAccountAddress] = useState<`0x${string}` | null>(null);

    useEffect(() => {
        let isMounted = true;

        const setupSmartAccount = async () => {
            if (!walletClient || !publicClient || !address) {
                if (isMounted) {
                    setIsReady(false);
                    setSmartAccountClient(null);
                    setSmartAccountAddress(null);
                }
                return;
            }

            try {
                // 1. Create Simple Account (Smart Account) wrapping the EOA
                const simpleAccount = await toSimpleSmartAccount({
                    client: publicClient,
                    owner: walletClient,
                    entryPoint: {
                        address: entryPoint07Address,
                        version: "0.7"
                    }
                } as any);
                
                if (!isMounted) return;
                setSmartAccountAddress(simpleAccount.address);

                // 2. Create the Smart Account Client (Bundler + Paymaster)
                const client = createSmartAccountClient({
                    account: simpleAccount,
                    chain: arbitrumSepolia,
                    bundlerTransport: http(`https://api.pimlico.io/v2/arbitrum-sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`),
                    paymaster: {
                        getPaymasterStubData: async () => {
                             return {
                                 paymaster: PAYMASTER_ADDRESS,
                                 paymasterData: "0x",
                                 paymasterVerificationGasLimit: BigInt(50000),
                                 paymasterPostOpGasLimit: BigInt(0),
                             };
                        },
                        getPaymasterData: async () => {
                             return {
                                 paymaster: PAYMASTER_ADDRESS,
                                 paymasterData: "0x",
                                 paymasterVerificationGasLimit: BigInt(50000),
                                 paymasterPostOpGasLimit: BigInt(0),
                             };
                        }
                    },
                    userOperation: {
                        estimateFeesPerGas: async () => {
                            return (await pimlicoClient.getUserOperationGasPrice()).fast;
                        }
                    }
                });

                if (!isMounted) return;
                setSmartAccountClient(client);
                setIsReady(true);
                console.log("Smart Account Ready globally:", simpleAccount.address);

            } catch (error) {
                console.error("Failed to setup smart account:", error);
            }
        };

        if (isConnected) {
            setupSmartAccount();
        } else {
            setIsReady(false);
            setSmartAccountClient(null);
            setSmartAccountAddress(null);
        }

        return () => {
            isMounted = false;
        };
    }, [address, walletClient, publicClient, isConnected]);

    return (
        <SmartAccountContext.Provider value={{ smartAccountClient, smartAccountAddress, isReady }}>
            {children}
        </SmartAccountContext.Provider>
    );
}

export function useSmartAccount() {
    return useContext(SmartAccountContext);
}
