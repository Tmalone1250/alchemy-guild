import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { arbitrumSepolia } from '@reown/appkit/networks'

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'ddd5b2069ee124de81721bd93cf79804';

// Use explicit tuple typing to satisfy the reown appkit expected array structure
export const networks: [any, ...any[]] = [arbitrumSepolia];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

console.log("Wagmi/Reown AppKit initialized on network: Arbitrum Sepolia (421614)");

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Alchemy Guild',
    description: 'Gamified DeFi Protocol',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://alchemyguild.io',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  features: {
    analytics: true
  }
})

export const wagmiConfig = wagmiAdapter.wagmiConfig
