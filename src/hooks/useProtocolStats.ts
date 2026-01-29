import { useState, useEffect, useRef } from 'react';
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import { CONTRACTS, DEPLOYMENT_BLOCK } from '../config/contracts';

export interface ProtocolStats {
    uniqueHolders: number;
    totalStaked: number;
    totalYieldClaimed: string;
    stakingByTier: { [key: number]: number };
    yieldHistory: { date: string; value: number }[];
    isLoading: boolean;
    volume24h: string;
    tvl: string;
}

const CHUNK_SIZE = 40000n; // Reduced to 40k to satisfy RPC limit (50k max)
const CONCURRENCY_LIMIT = 5; // Parallel requests

// Create a dedicated client for analytics to avoid WalletConnect rate limits
const analyticsClient = createPublicClient({
    chain: sepolia,
    transport: http('https://ethereum-sepolia.publicnode.com', {
        timeout: 30_000, 
        retryCount: 3,
        retryDelay: 1000
    }) 
});

export function useProtocolStats() {
    const [stats, setStats] = useState<ProtocolStats>({
        uniqueHolders: 0,
        totalStaked: 0,
        totalYieldClaimed: '0',
        stakingByTier: {},
        yieldHistory: [],
        isLoading: true,
        volume24h: '0',
        tvl: '0',
    });

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        
        const fetchStats = async () => {
            try {
                const currentBlock = await analyticsClient.getBlockNumber();
                
                // Helper to fetch logs in chunks with concurrency
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
                        // Small delay between batches to be nice
                        await new Promise(r => setTimeout(r, 50));
                    }
                    return results;
                };

                // --- 1. Fetch Logs (Parallel) ---
                console.log(`Fetching stats from block ${DEPLOYMENT_BLOCK} to ${currentBlock}`);
                
                const [transferLogs, stakedLogs, unstakedLogs, yieldLogs] = await Promise.all([
                    fetchLogsInChunksParallel(
                        CONTRACTS.ElementNFT.address as `0x${string}`,
                        parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
                        DEPLOYMENT_BLOCK,
                        currentBlock
                    ),
                    fetchLogsInChunksParallel(
                        CONTRACTS.YieldVault.address as `0x${string}`,
                        parseAbiItem('event Staked(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 weight)'),
                        DEPLOYMENT_BLOCK,
                        currentBlock
                    ),
                    fetchLogsInChunksParallel(
                        CONTRACTS.YieldVault.address as `0x${string}`,
                        parseAbiItem('event Unstaked(address indexed user, uint256 indexed tokenId, uint256 reward)'),
                        DEPLOYMENT_BLOCK,
                        currentBlock
                    ),
                    fetchLogsInChunksParallel(
                        CONTRACTS.YieldVault.address as `0x${string}`,
                        parseAbiItem('event YieldClaimed(address indexed user, uint256 indexed tokenId, uint256 reward)'),
                        DEPLOYMENT_BLOCK,
                        currentBlock
                    )
                ]);

                if (!isMounted.current) return;

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

                const stakedTokens = new Map<string, number>();
                if (stakedLogs) {
                    stakedLogs.forEach(log => {
                        const { tokenId, tier } = log.args;
                        if (tokenId !== undefined && tier !== undefined) stakedTokens.set(tokenId.toString(), Number(tier));
                    });
                }
                if (unstakedLogs) {
                    unstakedLogs.forEach(log => {
                        const { tokenId } = log.args;
                        if (tokenId !== undefined) stakedTokens.delete(tokenId.toString());
                    });
                }

                const stakingByTier: { [key: number]: number } = { 1: 0, 2: 0, 3: 0 };
                stakedTokens.forEach((tier) => {
                    stakingByTier[tier] = (stakingByTier[tier] || 0) + 1;
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
                        // USDC has 6 decimals
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

                // --- 3. Process Volume & TVL (Current State) ---
                const poolAddress = CONTRACTS.Pool.address as `0x${string}`;

                // Fetch Balances for TVL
                const [wethBal, usdcBal] = await Promise.all([
                    analyticsClient.readContract({
                        address: CONTRACTS.WETH.address as `0x${string}`,
                        abi: [parseAbiItem('function balanceOf(address) view returns (uint256)')],
                        functionName: 'balanceOf',
                        args: [poolAddress]
                    }) as Promise<bigint>,
                    analyticsClient.readContract({
                        address: CONTRACTS.USDC.address as `0x${string}`,
                        abi: [parseAbiItem('function balanceOf(address) view returns (uint256)')],
                        functionName: 'balanceOf',
                        args: [poolAddress]
                    }) as Promise<bigint>
                ]);

                // Fetch Swaps for Volume (shorter range for speed)
                const volumeFromBlock = currentBlock - 7200n;
                const swapLogs = await analyticsClient.getLogs({
                    address: poolAddress,
                    event: parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'),
                    fromBlock: volumeFromBlock > 0n ? volumeFromBlock : 0n,
                    toBlock: currentBlock,
                });

                let volumeWeth = 0n;
                swapLogs.forEach(log => {
                    const amount1 = log.args.amount1!;
                    volumeWeth += amount1 < 0n ? -amount1 : amount1;
                });

                // Fetch YieldVault's USDC balance for actual TVL
                const vaultUsdc = await analyticsClient.readContract({
                    address: CONTRACTS.USDC.address as `0x${string}`,
                    abi: [parseAbiItem('function balanceOf(address) view returns (uint256)')],
                    functionName: 'balanceOf',
                    args: [CONTRACTS.YieldVault.address]
                }) as bigint;

                setStats({
                    uniqueHolders: uniqueAddresses.size,
                    totalStaked: stakedTokens.size,
                    totalYieldClaimed: (Number(totalYield) / 1e6).toFixed(6),
                    stakingByTier,
                    yieldHistory: sampledHistory.length > 0 ? sampledHistory : [{ date: 'Start', value: 0 }],
                    isLoading: false,
                    volume24h: formatEther(volumeWeth),
                    tvl: (Number(vaultUsdc) / 1e6).toFixed(2),
                });

            } catch (error) {
                console.error('Error fetching protocol stats:', error);
                if (isMounted.current) {
                    setStats(prev => ({ ...prev, isLoading: false }));
                }
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
