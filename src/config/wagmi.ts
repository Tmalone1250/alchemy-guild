import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia } from '@reown/appkit/networks'

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'ddd5b2069ee124de81721bd93cf79804';

export const networks = [sepolia]

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

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
