import { useEffect, useState, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, decodeEventLog } from 'viem';
import { CONTRACTS } from '@/config/contracts';
import { ActivityEvent } from '@/types/nft';

const CACHE_KEY = 'alchemy_guild_activity_cache_v3';
const SEVEN_DAYS_SEC = 7 * 24 * 60 * 60;
const MAX_BLOCK_RANGE = 50000n;

export function useRecentActivity() {
    const publicClient = usePublicClient();
    
    // Initialize state from localStorage so it persists immediately on mount
    const [activities, setActivities] = useState<ActivityEvent[]>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed.activities)) {
                    const nowSec = Math.floor(Date.now() / 1000);
                    // Only return activities within the last 7 days
                    return parsed.activities.filter((a: ActivityEvent) => (nowSec - a.timestamp) <= SEVEN_DAYS_SEC);
                }
            }
        } catch(e) {
            console.error("Failed to parse cached activity", e);
        }
        return [];
    });
    
    const [isLoading, setIsLoading] = useState(activities.length === 0);
    const [error, setError] = useState<Error | null>(null);

    const fetchActivity = useCallback(async () => {
        if (!publicClient) return;

        setError(null);

        try {
            const currentBlock = await publicClient.getBlockNumber();
            
            // Get last fetched block from localStorage
            let cachedLastBlock = 0n;
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed.lastBlock) cachedLastBlock = BigInt(parsed.lastBlock);
                }
            } catch(e) {}

            let fromBlock = cachedLastBlock ? cachedLastBlock + 1n : currentBlock - MAX_BLOCK_RANGE;
            
            // If the gap is too large, fallback to MAX_BLOCK_RANGE to avoid RPC limits
            if (currentBlock - fromBlock > MAX_BLOCK_RANGE) {
                fromBlock = currentBlock - MAX_BLOCK_RANGE;
            }
            if (fromBlock > currentBlock) {
                fromBlock = currentBlock;
            }

            // Only fetch if there's a new block
            if (fromBlock > currentBlock && cachedLastBlock > 0n) {
                setIsLoading(false);
                return;
            }

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
                        amount: (Number(args.reward) / 1e6).toFixed(2),
                        timestamp,
                        txHash: log.transactionHash,
                    });
                } else if (eventName === 'YieldClaimed') {
                    events.push({
                        id: `${log.transactionHash}-${log.logIndex}`,
                        type: 'claim',
                        tokenId: Number(args.tokenId),
                        amount: (Number(args.reward) / 1e6).toFixed(2),
                        timestamp,
                        txHash: log.transactionHash,
                    });
                }
            }

            // Process Transfer Logs (Mint & Craft detection)
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
                    for (const mint of mints) {
                        events.push({
                            id: `${txHash}-${mint.logIndex}`,
                            type: 'mint',
                            tokenId: Number(mint.args.tokenId),
                            timestamp,
                            txHash,
                        });
                    }
                }
            }

            // Update Activities State and Cache
            setActivities(prev => {
                // Map to deduplicate events by ID
                const existing = new Map(prev.map(e => [e.id, e]));
                for (const e of events) {
                    existing.set(e.id, e);
                }

                const nowSec = Math.floor(Date.now() / 1000);

                // Convert to array, filter out old events, sort descending
                const merged = Array.from(existing.values())
                    .filter(e => (nowSec - e.timestamp) <= SEVEN_DAYS_SEC)
                    .sort((a, b) => b.timestamp - a.timestamp);
                
                // Keep up to 500 events to prevent local storage bloat over 7 days
                const cappedEvents = merged.slice(0, 500);

                // Cache to localStorage
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    activities: cappedEvents,
                    lastBlock: currentBlock.toString()
                }));

                return cappedEvents;
            });

        } catch (err) {
            console.error("Failed to fetch activity:", err);
            setError(err instanceof Error ? err : new Error('Unknown error fetching activity'));
        } finally {
            setIsLoading(false);
        }
    }, [publicClient]);

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(fetchActivity, 15000);
        return () => clearInterval(interval);
    }, [fetchActivity]);

    return { activities, isLoading, error, refetch: fetchActivity };
}
