import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { createSmartAccountClient, SmartAccountClient } from 'permissionless';
import { entryPoint07Address } from 'viem/account-abstraction';
import { pimlicoClient } from '../config/pimlico';
import { PAYMASTER_ADDRESS } from '../config/contracts';
import { http } from 'viem';
import { sepolia } from 'viem/chains';

export function useSmartAccount() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const [smartAccountClient, setSmartAccountClient] = useState<SmartAccountClient | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [smartAccountAddress, setSmartAccountAddress] = useState<`0x${string}` | null>(null);

    useEffect(() => {
        const setupSmartAccount = async () => {
            if (!walletClient || !publicClient || !address) return;

            try {
                // 1. Create Simple Account (Smart Account) wrapping the EOA
                // Note: We use the signer (walletClient) to control the smart account
                const simpleAccount = await toSimpleSmartAccount({
                    client: publicClient,
                    owner: walletClient,
                    entryPoint: {
                        address: entryPoint07Address,
                        version: "0.7"
                    }
                });
                
                setSmartAccountAddress(simpleAccount.address);

                // 2. Create the Smart Account Client (Bundler + Paymaster)
                const smartAccountClient = createSmartAccountClient({
                    account: simpleAccount,
                    chain: sepolia, // Use standard chain definition
                    bundlerTransport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`),
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

                setSmartAccountClient(smartAccountClient);
                setIsReady(true);
                console.log("Smart Account Ready:", simpleAccount.address);

            } catch (error) {
                console.error("Failed to setup smart account:", error);
            }
        };

        if (isConnected) {
            setupSmartAccount();
        }
    }, [address, walletClient, publicClient, isConnected]);

    return {
        smartAccountClient,
        smartAccountAddress,
        isReady
    };
}
