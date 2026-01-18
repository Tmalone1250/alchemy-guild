// Smart Contract Configuration - Sepolia Testnet

export const CONTRACTS = {
  ElementNFT: {
    address: '0x055fdAE960FF3d9d60F160173B7629Bc1440d99A' as const,
    chainId: 11155111, // Sepolia
  },
  YieldVault: {
    address: '0x15e771dA9D40074db4Deb0e81EE4Ca4aC0a4937F' as const,
    chainId: 11155111,
  },
  Alchemist: {
    address: '0xdB4Ab958339613246Ca056582dBdE6C1FD3a6dC6' as const,
    chainId: 11155111,
  },
  Treasury: {
    address: '0xBBDb619847CFC6F7e1F0f909684fE7d1418667B6' as const,
    chainId: 11155111,
  },
} as const;

// Element Types
export type ElementType = 'Earth' | 'Water' | 'Wind' | 'Fire' | 'Ice' | 'Lightning' | 
  'Plasma' | 'Tornado' | 'Blizzard' | 'Tsunami' | 'Quake' | 'Inferno' |
  'Holy' | 'Dark' | 'Gravity' | 'Time' | 'Bio' | 'Spirit';

export const ELEMENTS: { id: number; name: ElementType; icon: string }[] = [
  // Tier I
  { id: 0, name: 'Earth', icon: 'Mountain' },
  { id: 1, name: 'Water', icon: 'Droplets' },
  { id: 2, name: 'Wind', icon: 'Wind' },
  { id: 3, name: 'Fire', icon: 'Flame' },
  { id: 4, name: 'Ice', icon: 'Snowflake' },
  { id: 5, name: 'Lightning', icon: 'Zap' },
  // Tier II
  { id: 6, name: 'Plasma', icon: 'Zap' },
  { id: 7, name: 'Tornado', icon: 'Wind' },
  { id: 8, name: 'Blizzard', icon: 'Snowflake' },
  { id: 9, name: 'Tsunami', icon: 'Droplets' },
  { id: 10, name: 'Quake', icon: 'Mountain' },
  { id: 11, name: 'Inferno', icon: 'Flame' },
  // Tier III
  { id: 12, name: 'Holy', icon: 'Zap' },
  { id: 13, name: 'Dark', icon: 'Zap' },
  { id: 14, name: 'Gravity', icon: 'Mountain' },
  { id: 15, name: 'Time', icon: 'Wind' },
  { id: 16, name: 'Bio', icon: 'Droplets' },
  { id: 17, name: 'Spirit', icon: 'Flame' },
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
