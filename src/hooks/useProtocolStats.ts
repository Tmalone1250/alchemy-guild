import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, formatEther } from 'viem';
import { CONTRACTS } from '../config/contracts';

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

    const publicClient = usePublicClient();

    useEffect(() => {
        const fetchStats = async () => {
            if (!publicClient) return;

            try {
                const currentBlock = await publicClient.getBlockNumber();
                // RPC Limit is 50k blocks. We'll fetch last 40k to be safe.
                const MAX_RANGE = BigInt(40000);
                let fromBlock = currentBlock - MAX_RANGE;
                if (fromBlock < 0n) fromBlock = 0n;

                // --- 1. Fetch Basic Protocol Stats ---
                const [transferLogs, stakedLogs, unstakedLogs, yieldLogs] = await Promise.all([
                    publicClient.getLogs({
                        address: CONTRACTS.ElementNFT.address as `0x${string}`,
                        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
                        fromBlock,
                        toBlock: currentBlock,
                    }),
                    publicClient.getLogs({
                        address: CONTRACTS.YieldVault.address as `0x${string}`,
                        event: parseAbiItem('event Staked(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 weight)'),
                        fromBlock,
                        toBlock: currentBlock,
                    }),
                    publicClient.getLogs({
                        address: CONTRACTS.YieldVault.address as `0x${string}`,
                        event: parseAbiItem('event Unstaked(address indexed user, uint256 indexed tokenId, uint256 reward)'),
                        fromBlock,
                        toBlock: currentBlock,
                    }),
                    publicClient.getLogs({
                        address: CONTRACTS.YieldVault.address as `0x${string}`,
                        event: parseAbiItem('event YieldClaimed(address indexed user, uint256 indexed tokenId, uint256 reward)'),
                        fromBlock,
                        toBlock: currentBlock,
                    })
                ]);

                // --- 2. Process Basic Stats ---
                const owners = new Map<string, string>();
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
                const uniqueAddresses = new Set(owners.values());

                const stakedTokens = new Map<string, number>();
                stakedLogs.forEach(log => {
                    const { tokenId, tier } = log.args;
                    if (tokenId && tier !== undefined) stakedTokens.set(tokenId.toString(), tier);
                });
                unstakedLogs.forEach(log => {
                    const { tokenId } = log.args;
                    if (tokenId) stakedTokens.delete(tokenId.toString());
                });

                const stakingByTier: { [key: number]: number } = { 1: 0, 2: 0, 3: 0 };
                stakedTokens.forEach((tier) => {
                    stakingByTier[tier] = (stakingByTier[tier] || 0) + 1;
                });

                let totalYield = BigInt(0);
                const allRewardEvents = [
                    ...unstakedLogs.map(l => ({ ...l, reward: l.args.reward })),
                    ...yieldLogs.map(l => ({ ...l, reward: l.args.reward }))
                ].sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));

                const yieldHistoryPoints: { date: string, value: number }[] = [];
                let cumulativeYield = 0;
                allRewardEvents.forEach(e => {
                    if (e.reward) {
                        totalYield += e.reward;
                        cumulativeYield += parseFloat(formatEther(e.reward));
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

                // --- 3. Process Volume & TVL (Uniswap V3) ---
                const poolAddress = CONTRACTS.Pool.address as `0x${string}`;

                // Fetch Balances for TVL
                const [wethBal, usdcBal] = await Promise.all([
                    publicClient.readContract({
                        address: CONTRACTS.WETH.address as `0x${string}`,
                        abi: [parseAbiItem('function balanceOf(address) view returns (uint256)')],
                        functionName: 'balanceOf',
                        args: [poolAddress]
                    }) as Promise<bigint>,
                    publicClient.readContract({
                        address: CONTRACTS.USDC.address as `0x${string}`,
                        abi: [parseAbiItem('function balanceOf(address) view returns (uint256)')],
                        functionName: 'balanceOf',
                        args: [poolAddress]
                    }) as Promise<bigint>
                ]);

                // Calculate TVL: Just sum both as "Total Liquidity" roughly in logic, but for display let's show WETH + USDC
                // For the UI, we pass a single string. Let's pass WETH amount + " WETH" for now as it's the main asset.
                // Or better: formatEther(wethBal)

                // Fetch Swaps for Volume
                const volumeFromBlock = currentBlock - 7200n;
                const swapLogs = await publicClient.getLogs({
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

                setStats({
                    uniqueHolders: uniqueAddresses.size,
                    totalStaked: stakedTokens.size,
                    totalYieldClaimed: formatEther(totalYield),
                    stakingByTier,
                    yieldHistory: sampledHistory.length > 0 ? sampledHistory : [{ date: 'Start', value: 0 }],
                    isLoading: false,
                    volume24h: formatEther(volumeWeth),
                    tvl: formatEther(wethBal),
                });

            } catch (error) {
                console.error('Error fetching protocol stats:', error);
                setStats(prev => ({ ...prev, isLoading: false }));
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [publicClient]);

    return stats;
}
