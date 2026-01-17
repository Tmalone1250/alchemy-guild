// Smart Contract Configuration - Sepolia Testnet

export const CONTRACTS = {
  ElementNFT: {
    address: '0xC612a77AF5C1108f354a40e70677df19D3781396' as const,
    chainId: 11155111, // Sepolia
  },
  YieldVault: {
    address: '0x7d1D001f4CAcdC25119249CA1A7Add990034e646' as const,
    chainId: 11155111,
  },
  Alchemist: {
    address: '0x55814944334b230c7818Df81434c868b01D82fD7' as const,
    chainId: 11155111,
  },
  Treasury: {
    address: '0x2644ccEFC1501138a5E6418f9C4653d2573B6D91' as const,
    chainId: 11155111,
  },
} as const;

// Element Types
export type ElementType = 'Earth' | 'Fire' | 'Water' | 'Wind' | 'Ice' | 'Lightning';

export const ELEMENTS: { id: number; name: ElementType; icon: string }[] = [
  { id: 0, name: 'Earth', icon: 'Mountain' },
  { id: 1, name: 'Fire', icon: 'Flame' },
  { id: 2, name: 'Water', icon: 'Droplets' },
  { id: 3, name: 'Wind', icon: 'Wind' },
  { id: 4, name: 'Ice', icon: 'Snowflake' },
  { id: 5, name: 'Lightning', icon: 'Zap' },
];

// Tier Configuration
export type TierType = 'Lead' | 'Silver' | 'Gold';

export const TIERS: { id: number; name: TierType; weight: number }[] = [
  { id: 1, name: 'Lead', weight: 100 },
  { id: 2, name: 'Silver', weight: 135 },
  { id: 3, name: 'Gold', weight: 175 },
];

// Protocol Fee for crafting
export const CRAFT_FEE = '0.002';

// Sepolia Chain Config
export const SEPOLIA_CHAIN = {
  id: 11155111,
  name: 'Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://rpc.sepolia.org'] },
    default: { http: ['https://rpc.sepolia.org'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
} as const;
