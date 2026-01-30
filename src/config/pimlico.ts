import { createClient, http } from 'viem';
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { SEPOLIA_CHAIN } from './contracts';

const apiKey = import.meta.env.VITE_PIMLICO_API_KEY;

if (!apiKey) {
    console.error("Missing VITE_PIMLICO_API_KEY in .env");
}

const transportUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`;

export const pimlicoClient = createPimlicoClient({
    transport: http(transportUrl),
    entryPoint: entryPoint07Address,
    chain: {
        ...SEPOLIA_CHAIN,
        rpcUrls: {
            default: { http: [transportUrl] },
            public: { http: [transportUrl] }
        }
    }
});
