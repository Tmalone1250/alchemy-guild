import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { sepolia } from 'wagmi/chains'

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'ddd5b2069ee124de81721bd93cf79804';

const metadata = {
  name: 'Alchemy Guild',
  description: 'Gamified DeFi Protocol',
  url: 'https://alchemyguild.io',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const chains = [sepolia] as const;

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})
