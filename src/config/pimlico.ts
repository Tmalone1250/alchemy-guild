import { createClient, http } from 'viem';
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { arbitrumSepolia } from 'viem/chains';

const apiKey = import.meta.env.VITE_PIMLICO_API_KEY;

if (!apiKey) {
    console.error("Missing VITE_PIMLICO_API_KEY in .env");
}

// Updated to Arbitrum Sepolia — matches our deployed contract suite (chainId: 421614)
const transportUrl = `https://api.pimlico.io/v2/arbitrum-sepolia/rpc?apikey=${apiKey}`;

export const pimlicoClient = createPimlicoClient({
    transport: http(transportUrl),
    entryPoint: {
        address: entryPoint07Address,
        version: "0.7"
    },
    chain: {
        ...arbitrumSepolia,
        rpcUrls: {
            default: { http: [transportUrl] },
            public: { http: [transportUrl] }
        }
    }
});
