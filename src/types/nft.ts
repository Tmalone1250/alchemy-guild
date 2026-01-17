import { ElementType, TierType } from '@/config/contracts';

export interface NFT {
  tokenId: number;
  element: ElementType;
  tier: TierType;
  staked: boolean;
  pendingYield?: string;
  stakedAt?: number;
}

export interface ActivityEvent {
  id: string;
  type: 'mint' | 'stake' | 'unstake' | 'claim' | 'craft';
  tokenId?: number;
  amount?: string;
  timestamp: number;
  txHash: string;
}

export interface ProtocolStats {
  tvl: string;
  globalYieldIndex: string;
  totalStaked: number;
  totalMinted: number;
}
