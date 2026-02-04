// Smart Contract Configuration - Sepolia Testnet

export const PAYMASTER_ADDRESS = "0x353A1d7795bAdA4727179c09216b0e7DEE8B83D3";

export const CONTRACTS = {
  ElementNFT: {
    address: '0x2BFbf65eFEbEae93cbBEb791ed93fF8DEb4E02b9' as const,
    chainId: 11155111, // Sepolia
  },
  YieldVault: {
    address: "0x6e09aDfaf01c32B692e959f411fCD4a37DA811F4" as const, // FIXED Receive Loop Vault
    chainId: 11155111,
  },
  Alchemist: {
    address: '0x8abC5a1693dc45106E47e1Ec13a9d7FB150E94F0' as const,
    chainId: 11155111,
  },
  Treasury: {
    address: '0xf4EbEB758ebb09631B2bA5d9Cb413F8f0f7d9568' as const,
    chainId: 11155111,
  },
  Pool: { // WETH/USDC 0.3%
    address: '0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50' as const,
    chainId: 11155111,
  },
  WETH: {
    address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as const,
    chainId: 11155111,
  },
  USDC: {
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const,
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


// Deployment Block for Analytics (YieldVault)
export const DEPLOYMENT_BLOCK = 10000000n;


