// Smart Contract Configuration - Arbitrum Sepolia (chainId: 421614)
// Full migration: 2026-07-15 — Migrated to Arbitrum Sepolia for iExec Nox TEE precompile architecture

// ── Deployed Contract Addresses (To be updated post Arbitrum Sepolia redeployment) ────────────────
export const YIELD_VAULT_ADDRESS       = "0x8D8420C4b6C0e32003456C7A0c3FED2Bd6144E28" as const;
export const GUILD_TOKEN_ADDRESS       = "0xe2026C28F0F1DaFAbdd10823c54a411590b4f190" as const;
export const CGUILD_ADDRESS            = "0xA6efeeBD751796031968Fb1F5EBdB373BCDC3e45" as const;
export const GUILD_DAO_ADDRESS         = "0x3c83c1C5C5607d91A562b70cC281b08dfdaB422d" as const;
export const ELEMENT_NFT_ADDRESS       = "0xf6f6147b1e930566642723722000690468853708" as const;
export const ALCHEMIST_ADDRESS         = "0x946820228d8fFBD35CDe402333B7fBb2e7cBfC8c" as const;
export const GUILD_DISTRIBUTOR_ADDRESS = "0xc82F69B3A78Cf3CD77adD5C35254b633A32e2A10" as const;

// ── Arbitrum Sepolia Ecosystem Constants ───────────────────────────────────────────
export const WETH_ADDRESS              = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73" as const;
export const USDC_ADDRESS              = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as const;
export const PAYMASTER_ADDRESS         = "0xa9924829148A1a1Bd057EAC11B448084cDCbC60a" as const;

// ── Governance Parameters (match verified contract constants) ──────────────────
export const PROPOSAL_THRESHOLD_cGUILD = 500n * 10n ** 18n; // 500 cGUILD required to create proposal
export const VOTE_COST_GUILD           = 10n  * 10n ** 18n; // 10 GUILD burned per vote cast

// ── Unified CONTRACTS Map (all Arbitrum Sepolia, chainId: 421614) ──────────────
export const CONTRACTS = {
  YieldVault: {
    address: YIELD_VAULT_ADDRESS,
    chainId: 421614,
  },
  GuildToken: {
    address: GUILD_TOKEN_ADDRESS,
    chainId: 421614,
  },
  cGUILD: {
    address: CGUILD_ADDRESS,
    chainId: 421614,
  },
  GuildDAO: {
    address: GUILD_DAO_ADDRESS,
    chainId: 421614,
  },
  ElementNFT: {
    address: ELEMENT_NFT_ADDRESS,
    chainId: 421614,
  },
  Alchemist: {
    address: ALCHEMIST_ADDRESS,
    chainId: 421614,
  },
  GuildDistributor: {
    address: GUILD_DISTRIBUTOR_ADDRESS,
    chainId: 421614,
  },
  Treasury: {
    // Deployer wallet acts as treasury (80M GUILD allocation)
    address: '0x50F9F043500eC3c3FB733B94F2EC27a9030e00EF' as const,
    chainId: 421614,
  },
  WETH: {
    address: WETH_ADDRESS,
    chainId: 421614,
  },
  USDC: {
    address: USDC_ADDRESS,
    chainId: 421614,
  },
} as const;

// ── Element Types ──────────────────────────────────────────────────────────────
export type ElementType = 'Earth' | 'Water' | 'Wind' | 'Fire' | 'Ice' | 'Lightning' |
  'Plasma' | 'Tornado' | 'Blizzard' | 'Tsunami' | 'Quake' | 'Inferno' |
  'Holy' | 'Dark' | 'Gravity' | 'Time' | 'Bio' | 'Spirit';

export const ELEMENTS: { id: number; name: ElementType; icon: string }[] = [
  // Tier I
  { id: 0,  name: 'Earth',     icon: 'Mountain' },
  { id: 1,  name: 'Water',     icon: 'Droplets' },
  { id: 2,  name: 'Wind',      icon: 'Wind' },
  { id: 3,  name: 'Fire',      icon: 'Flame' },
  { id: 4,  name: 'Ice',       icon: 'Snowflake' },
  { id: 5,  name: 'Lightning', icon: 'Zap' },
  // Tier II
  { id: 6,  name: 'Plasma',    icon: 'Zap' },
  { id: 7,  name: 'Tornado',   icon: 'Wind' },
  { id: 8,  name: 'Blizzard',  icon: 'Snowflake' },
  { id: 9,  name: 'Tsunami',   icon: 'Droplets' },
  { id: 10, name: 'Quake',     icon: 'Mountain' },
  { id: 11, name: 'Inferno',   icon: 'Flame' },
  // Tier III
  { id: 12, name: 'Holy',      icon: 'Zap' },
  { id: 13, name: 'Dark',      icon: 'Zap' },
  { id: 14, name: 'Gravity',   icon: 'Mountain' },
  { id: 15, name: 'Time',      icon: 'Wind' },
  { id: 16, name: 'Bio',       icon: 'Droplets' },
  { id: 17, name: 'Spirit',    icon: 'Flame' },
];

// ── Tier Configuration ─────────────────────────────────────────────────────────
export type TierType = 'Lead' | 'Silver' | 'Gold';

export const TIERS: { id: number; name: TierType; weight: number }[] = [
  { id: 1, name: 'Lead',   weight: 100 },
  { id: 2, name: 'Silver', weight: 135 },
  { id: 3, name: 'Gold',   weight: 175 },
];

// ── Protocol Fee ──────────────────────────────────────────────────────────────
export const CRAFT_FEE = '0.002';

// ── Arbitrum Sepolia Chain Config ─────────────────────────────────────────────
export const ARBITRUM_SEPOLIA_CHAIN = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  network: 'arbitrum-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
    default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
  },
  testnet: true,
} as const;

// Keep alias for backward compatibility with imports during migration if any
export const BASE_SEPOLIA_CHAIN = ARBITRUM_SEPOLIA_CHAIN;

// ── Deployment Block for Analytics ────────────────────────────────────────────
export const DEPLOYMENT_BLOCK = 288201000n;
