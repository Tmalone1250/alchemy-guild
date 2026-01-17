import { NFT, ActivityEvent, ProtocolStats } from '@/types/nft';

export const mockNFTs: NFT[] = [
  { tokenId: 1, element: 'Fire', tier: 'Lead', staked: true, pendingYield: '12.45', stakedAt: Date.now() - 86400000 * 3 },
  { tokenId: 2, element: 'Water', tier: 'Silver', staked: true, pendingYield: '28.92', stakedAt: Date.now() - 86400000 * 7 },
  { tokenId: 3, element: 'Earth', tier: 'Lead', staked: false },
  { tokenId: 4, element: 'Lightning', tier: 'Gold', staked: true, pendingYield: '156.78', stakedAt: Date.now() - 86400000 * 14 },
  { tokenId: 5, element: 'Wind', tier: 'Lead', staked: false },
  { tokenId: 6, element: 'Ice', tier: 'Silver', staked: false },
  { tokenId: 7, element: 'Fire', tier: 'Lead', staked: false },
  { tokenId: 8, element: 'Water', tier: 'Lead', staked: true, pendingYield: '8.33', stakedAt: Date.now() - 86400000 * 2 },
  { tokenId: 9, element: 'Earth', tier: 'Gold', staked: false },
  { tokenId: 10, element: 'Lightning', tier: 'Lead', staked: false },
];

export const mockActivity: ActivityEvent[] = [
  { id: '1', type: 'claim', tokenId: 4, amount: '45.23', timestamp: Date.now() - 3600000, txHash: '0x1234...abcd' },
  { id: '2', type: 'craft', tokenId: 6, timestamp: Date.now() - 7200000, txHash: '0x5678...efgh' },
  { id: '3', type: 'stake', tokenId: 8, timestamp: Date.now() - 14400000, txHash: '0x9abc...ijkl' },
  { id: '4', type: 'mint', tokenId: 10, timestamp: Date.now() - 28800000, txHash: '0xdefg...mnop' },
  { id: '5', type: 'claim', tokenId: 2, amount: '28.92', timestamp: Date.now() - 43200000, txHash: '0xhijk...qrst' },
  { id: '6', type: 'unstake', tokenId: 5, timestamp: Date.now() - 86400000, txHash: '0xlmno...uvwx' },
];

export const mockProtocolStats: ProtocolStats = {
  tvl: '2,847,392.45',
  globalYieldIndex: '1.0847',
  totalStaked: 1247,
  totalMinted: 3892,
};

export const mockWalletData = {
  address: '0x1234...5678',
  balance: '2.458',
  isConnected: true,
};
