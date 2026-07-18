import { useState, useEffect, useRef } from 'react';
import { createPublicClient, http, fallback, parseAbiItem, formatEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { CONTRACTS, DEPLOYMENT_BLOCK } from '../config/contracts';

export interface ProtocolStats {
    uniqueHolders: number;
    totalStaked: number;
    totalYieldClaimed: string;
    stakingByTier: { [key: number]: number };
    userStakingByTier: { [key: number]: { [user: string]: number } };
    yieldHistory: { date: string; value: number }[];
    isLoading: boolean;
    volume24h: string;
    tvl: string;
}

const CHUNK_SIZE = 40000n; 
const CONCURRENCY_LIMIT = 5; 

// Fallback transport with multiple Arbitrum Sepolia RPCs to automatically failover if rate limited (CORS-friendly)
const urls = [
    'https://sepolia-rollup.arbitrum.io/rpc',
    'https://arbitrum-sepolia-rpc.publicnode.com',
    'https://arbitrum-sepolia.blockpi.network/v1/rpc/public'
].filter(Boolean) as string[];

const analyticsClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: fallback(
        urls.map(url => http(url, { timeout: 30_000 }))
    )
});

// Global cache variables to deduplicate concurrent/rapid calls and prevent 429s
let cachedStats: ProtocolStats | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15_000; // Cache for 15 seconds
let pendingPromise: Promise<ProtocolStats> | null = null;

export function useProtocolStats() {
    const [stats, setStats] = useState<ProtocolStats>({
        uniqueHolders: 0,
        totalStaked: 0,
        totalYieldClaimed: '0',
        stakingByTier: {},
        userStakingByTier: {},
        yieldHistory: [],
        isLoading: true,
        volume24h: '0',
        tvl: '0',
    });

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        
        const fetchStats = async () => {
            // 1. Return cached results immediately if fresh to avoid spamming the RPC
            if (cachedStats && (Date.now() - lastFetchTime) < CACHE_DURATION) {
                setStats(cachedStats);
                return;
            }

            // 2. Reuse in-flight promise if another component instance is already loading
            if (pendingPromise) {
                try {
                    const result = await pendingPromise;
                    if (isMounted.current) setStats(result);
                } catch (e) {
                    console.error("Error awaiting pending stats query:", e);
                }
                return;
            }

            // 3. Initiate the query
            pendingPromise = (async () => {
                const currentBlock = await analyticsClient.getBlockNumber();
                
                // Helper to fetch logs in chunks
                const fetchLogsInChunksParallel = async (address: `0x${string}`, event: any, fromBlock: bigint, toBlock: bigint) => {
                    const chunks: { from: bigint; to: bigint }[] = [];
                    let start = fromBlock;
                    while (start <= toBlock) {
                        const end = (start + CHUNK_SIZE) > toBlock ? toBlock : (start + CHUNK_SIZE);
                        chunks.push({ from: start, to: end });
                        start = end + 1n;
                    }

                    const results: any[] = [];
                    for (let i = 0; i < chunks.length; i += CONCURRENCY_LIMIT) {
                        const batch = chunks.slice(i, i + CONCURRENCY_LIMIT);
                        const batchResults = await Promise.all(
                            batch.map(async (chunk) => {
                                try {
                                    return await analyticsClient.getLogs({
                                        address,
                                        event,
                                        fromBlock: chunk.from,
                                        toBlock: chunk.to,
                                    });
                                } catch (e) {
                                    console.error(`Failed to fetch logs ${chunk.from}-${chunk.to}`, e);
                                    return [];
                                }
                            })
                        );
                        batchResults.forEach(logs => results.push(...logs));
                        await new Promise(r => setTimeout(r, 50));
                    }
                    return results;
                };

                // --- 1. Fetch Logs Sequentially with 200ms spacing to prevent 429 rates ---
                console.log(`Fetching stats from block ${DEPLOYMENT_BLOCK} to ${currentBlock}`);
                
                const transferLogs = await fetchLogsInChunksParallel(
                    CONTRACTS.ElementNFT.address as `0x${string}`,
                    parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
                    DEPLOYMENT_BLOCK,
                    currentBlock
                );
                await new Promise(r => setTimeout(r, 200));

                const stakedLogs = await fetchLogsInChunksParallel(
                    CONTRACTS.YieldVault.address as `0x${string}`,
                    parseAbiItem('event Staked(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 weight)'),
                    DEPLOYMENT_BLOCK,
                    currentBlock
                );
                await new Promise(r => setTimeout(r, 200));

                const unstakedLogs = await fetchLogsInChunksParallel(
                    CONTRACTS.YieldVault.address as `0x${string}`,
                    parseAbiItem('event Unstaked(address indexed user, uint256 indexed tokenId, uint256 reward)'),
                    DEPLOYMENT_BLOCK,
                    currentBlock
                );
                await new Promise(r => setTimeout(r, 200));

                const yieldLogs = await fetchLogsInChunksParallel(
                    CONTRACTS.YieldVault.address as `0x${string}`,
                    parseAbiItem('event YieldClaimed(address indexed user, uint256 indexed tokenId, uint256 reward)'),
                    DEPLOYMENT_BLOCK,
                    currentBlock
                );

                // --- 2. Process Stats ---
                const owners = new Map<string, string>();
                if (transferLogs) {
                    transferLogs.forEach(log => {
                        const { to, tokenId } = log.args;
                        if (to && tokenId) {
                            if (to === '0x0000000000000000000000000000000000000000') {
                                owners.delete(tokenId.toString());
                            } else {
                                owners.set(tokenId.toString(), to);
                            }
                        }
                    });
                }
                const uniqueAddresses = new Set(owners.values());

                const stakedTokens = new Map<string, { tier: number, user: string }>();
                
                // Combine and sort staked and unstaked logs chronologically
                const allStakingEvents = [
                    ...(stakedLogs || []).map(l => ({ ...l, type: 'STAKED' as const })),
                    ...(unstakedLogs || []).map(l => ({ ...l, type: 'UNSTAKED' as const }))
                ].sort((a, b) => {
                    if (a.blockNumber !== b.blockNumber) return Number(a.blockNumber) - Number(b.blockNumber);
                    if (a.transactionIndex !== b.transactionIndex) return Number(a.transactionIndex) - Number(b.transactionIndex);
                    return Number(a.logIndex) - Number(b.logIndex);
                });

                allStakingEvents.forEach(log => {
                    if (log.type === 'STAKED') {
                        const { user, tokenId, tier } = (log as any).args;
                        if (tokenId !== undefined && tier !== undefined && user) {
                            stakedTokens.set(tokenId.toString(), { tier: Number(tier), user: (user as string).toLowerCase() });
                        }
                    } else if (log.type === 'UNSTAKED') {
                        const { tokenId } = (log as any).args;
                        if (tokenId !== undefined) {
                            stakedTokens.delete(tokenId.toString());
                        }
                    }
                });

                const stakingByTier: { [key: number]: number } = { 1: 0, 2: 0, 3: 0 };
                const userStakingByTier: { [key: number]: { [user: string]: number } } = { 1: {}, 2: {}, 3: {} };
                
                stakedTokens.forEach((data) => {
                    stakingByTier[data.tier] = (stakingByTier[data.tier] || 0) + 1;
                    if (!userStakingByTier[data.tier][data.user]) {
                        userStakingByTier[data.tier][data.user] = 0;
                    }
                    userStakingByTier[data.tier][data.user] += 1;
                });

                let totalYield = BigInt(0);
                const allRewardEvents = [
                    ...(unstakedLogs || []).map(l => ({ ...l, reward: l.args.reward })),
                    ...(yieldLogs || []).map(l => ({ ...l, reward: l.args.reward }))
                ].sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));

                const yieldHistoryPoints: { date: string, value: number }[] = [];
                let cumulativeYield = 0;
                allRewardEvents.forEach(e => {
                    if (e.reward) {
                        totalYield += e.reward;
                        cumulativeYield += Number(e.reward) / 1e6;
                        yieldHistoryPoints.push({
                            date: `Block ${e.blockNumber}`,
                            value: cumulativeYield
                        });
                    }
                });

                const sampledHistory = yieldHistoryPoints.filter((_, i) => i % Math.max(1, Math.floor(yieldHistoryPoints.length / 20)) === 0);
                if (yieldHistoryPoints.length > 0 && sampledHistory[sampledHistory.length - 1] !== yieldHistoryPoints[yieldHistoryPoints.length - 1]) {
                    sampledHistory.push(yieldHistoryPoints[yieldHistoryPoints.length - 1]);
                }

                // --- 3. Process Volume & TVL ---
                const poolAddress = (CONTRACTS as any).Pool?.address;

                let volumeWeth = 0n;
                if (poolAddress) {
                    // Fetch Swaps for Volume
                    const volumeFromBlock = currentBlock - 7200n;
                    const swapLogs = await analyticsClient.getLogs({
                        address: poolAddress,
                        event: parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'),
                        fromBlock: volumeFromBlock > 0n ? volumeFromBlock : 0n,
                        toBlock: currentBlock,
                    } as any);

                    swapLogs.forEach(log => {
                        const amount1 = (log as any).args.amount1!;
                        volumeWeth += amount1 < 0n ? -amount1 : amount1;
                    });
                }

                // Fetch YieldVault's USDC balance for TVL
                const vaultUsdc = await (analyticsClient.readContract as any)({
                    address: CONTRACTS.USDC.address as `0x${string}`,
                    abi: [parseAbiItem('function balanceOf(address) view returns (uint256)')],
                    functionName: 'balanceOf',
                    args: [CONTRACTS.YieldVault.address]
                }) as bigint;

                return {
                    uniqueHolders: uniqueAddresses.size,
                    totalStaked: stakedTokens.size,
                    totalYieldClaimed: (Number(totalYield) / 1e6).toFixed(6),
                    stakingByTier,
                    userStakingByTier,
                    yieldHistory: sampledHistory.length > 0 ? sampledHistory : [{ date: 'Start', value: 0 }],
                    isLoading: false,
                    volume24h: formatEther(volumeWeth),
                    tvl: (Number(vaultUsdc) / 1e6).toFixed(2),
                };
            })();

            try {
                const result = await pendingPromise;
                cachedStats = result;
                lastFetchTime = Date.now();
                if (isMounted.current) {
                    setStats(result);
                }
            } catch (error) {
                console.error('Error fetching protocol stats:', error);
                if (isMounted.current) {
                    setStats(prev => ({ ...prev, isLoading: false }));
                }
            } finally {
                pendingPromise = null;
            }
        };

        fetchStats();
        // Poll every 5 minutes (reduced frequency)
        const interval = setInterval(fetchStats, 300000);
        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, []);

    return stats;
}
