import { useEffect, useState, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, Log, DecodeEventLogReturnType, decodeEventLog } from 'viem';
import { CONTRACTS } from '@/config/contracts';
import { ELEMENT_NFT_ABI, YIELD_VAULT_ABI } from '@/config/abis';
import { ActivityEvent } from '@/types/nft';

// Helper to decode logs safely
const safeDecodeLog = (abi: any, log: any) => {
    try {
        return decodeEventLog({
            abi,
            data: log.data,
            topics: log.topics,
        });
    } catch (error) {
        return null;
    }
};

export function useRecentActivity() {
    const publicClient = usePublicClient();
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchActivity = useCallback(async () => {
        if (!publicClient) return;

        setIsLoading(true);
        setError(null);

        try {
            const currentBlock = await publicClient.getBlockNumber();
            const fromBlock = currentBlock - 5000n; // Look back ~5000 blocks (adjustable)

            // 1. Fetch YieldVault Logs
            const yieldVaultLogs = await publicClient.getLogs({
                address: CONTRACTS.YieldVault.address,
                events: [
                    parseAbiItem('event Staked(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 weight)'),
                    parseAbiItem('event Unstaked(address indexed user, uint256 indexed tokenId, uint256 reward)'),
                    parseAbiItem('event YieldClaimed(address indexed user, uint256 indexed tokenId, uint256 reward)'),
                ],
                fromBlock,
                toBlock: currentBlock,
            });

            // 2. Fetch ElementNFT Mint/Burn Logs
            // We need Transfer events where from=0x0 (Mint) or to=0x0 (Burn)
            const transferLogs = await publicClient.getLogs({
                address: CONTRACTS.ElementNFT.address,
                event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
                fromBlock,
                toBlock: currentBlock,
            });

            // 3. Collect unique block numbers for timestamps
            const blockNumbers = new Set<bigint>();
            [...yieldVaultLogs, ...transferLogs].forEach(log => blockNumbers.add(log.blockNumber));

            // Batch fetch block timestamps
            const blockTimestamps = new Map<string, number>();
            await Promise.all(
                Array.from(blockNumbers).map(async (blockNumber) => {
                    const block = await publicClient.getBlock({ blockNumber });
                    blockTimestamps.set(blockNumber.toString(), Number(block.timestamp));
                })
            );

            // 4. Process Logs
            const events: ActivityEvent[] = [];

            // Process YieldVault Logs
            for (const log of yieldVaultLogs) {
                // We manually decode or use the typed event from viem if simpler, but let's handle args genericly
                // Since we provided 'events' array, viem might not refine the args type perfectly in a mixed array loop
                // but 'args' should be available.
                const eventName = (log as any).eventName;
                const args = (log as any).args;
                const timestamp = blockTimestamps.get(log.blockNumber.toString()) || 0;

                if (eventName === 'Staked') {
                    events.push({
                        id: `${log.transactionHash}-${log.logIndex}`,
                        type: 'stake',
                        tokenId: Number(args.tokenId),
                        timestamp,
                        txHash: log.transactionHash,
                    });
                } else if (eventName === 'Unstaked') {
                    events.push({
                        id: `${log.transactionHash}-${log.logIndex}`,
                        type: 'unstake',
                        tokenId: Number(args.tokenId),
                        amount: (Number(args.reward) / 1e6).toFixed(2), // USDC has 6 decimals
                        timestamp,
                        txHash: log.transactionHash,
                    });
                } else if (eventName === 'YieldClaimed') {
                    events.push({
                        id: `${log.transactionHash}-${log.logIndex}`,
                        type: 'claim',
                        tokenId: Number(args.tokenId),
                        amount: (Number(args.reward) / 1e6).toFixed(2), // USDC has 6 decimals
                        timestamp,
                        txHash: log.transactionHash,
                    });
                }
            }

            // Process Transfer Logs (Mint & Craft detection)
            // Group by Transaction Hash
            const txGroups = new Map<string, typeof transferLogs>();
            for (const log of transferLogs) {
                const txHash = log.transactionHash;
                if (!txGroups.has(txHash)) {
                    txGroups.set(txHash, []);
                }
                txGroups.get(txHash)?.push(log);
            }

            const zeroAddress = '0x0000000000000000000000000000000000000000';

            for (const [txHash, logs] of txGroups.entries()) {
                const timestamp = blockTimestamps.get(logs[0].blockNumber.toString()) || 0;

                const burns = logs.filter(l => l.args.to === zeroAddress);
                const mints = logs.filter(l => l.args.from === zeroAddress);

                // Crafting: 3 Burns + 1 Mint
                if (burns.length === 3 && mints.length === 1) {
                    events.push({
                        id: `${txHash}-craft`,
                        type: 'craft',
                        tokenId: Number(mints[0].args.tokenId),
                        timestamp,
                        txHash,
                    });
                } else {
                    // Identify individual Mints (not part of craft)
                    // We iterate mints and verify they aren't part of a craft pattern
                    // If strict "3 burns" rule failed, we assume they are just mints
                    // (or maybe bulk mints)
                    for (const mint of mints) {
                        events.push({
                            id: `${txHash}-${mint.logIndex}`,
                            type: 'mint',
                            tokenId: Number(mint.args.tokenId),
                            timestamp,
                            txHash,
                        });
                    }
                    // We generally ignore independent burns unless required, 
                    // as they might be just transfers to 0x0
                }
            }

            // Sort by timestamp desc and limit to 30 items
            events.sort((a, b) => b.timestamp - a.timestamp);
            const limitedEvents = events.slice(0, 30);

            console.log(`[ActivityHook] Processed ${limitedEvents.length} events (capped at 30)`);

            setActivities(limitedEvents);

        } catch (err) {
            console.error("Failed to fetch activity:", err);
            setError(err instanceof Error ? err : new Error('Unknown error fetching activity'));
        } finally {
            setIsLoading(false);
        }
    }, [publicClient]);

    useEffect(() => {
        fetchActivity();
        // Poll every 15 seconds
        const interval = setInterval(fetchActivity, 15000);
        return () => clearInterval(interval);
    }, [fetchActivity]);

    return { activities, isLoading, error, refetch: fetchActivity };
}
