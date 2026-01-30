import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.VITE_INFURA_RPC_URL;

async function main() {
    if (!PRIVATE_KEY || !RPC_URL) throw new Error("Missing env vars");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`User: ${wallet.address}`);
    
    // Get current nonce
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log(`Current Nonce: ${nonce}`);
    
    // We assume the sequence:
    // 1. Deploy (nonce X)
    // 2. Whitelist 1 (nonce X+1)
    // 3. Whitelist 2 (nonce X+2)
    // 4. Deposit (nonce X+3)
    // Current nonce should be X+4 (if everything finished).
    
    // So deployment nonce was nonce - 4.
    // Let's check a range just in case.
    
    for (let i = 1; i <= 10; i++) {
        const deploymentNonce = nonce - i;
        if (deploymentNonce < 0) continue;
        
        const address = ethers.getContractAddress({
            from: wallet.address,
            nonce: deploymentNonce
        });
        
        console.log(`Nonce ${deploymentNonce} => Address: ${address}`);
        
        // Double check if this is a contract
        const code = await provider.getCode(address);
        if (code !== "0x") {
            try {
                // Try to call owner() to see if it's our Paymaster
                const contract = new ethers.Contract(address, ["function owner() view returns (address)"], provider);
                const owner = await contract.owner();
                if (owner.toLowerCase() === wallet.address.toLowerCase()) {
                     console.log(`✅ FOUND PAYMASTER (Owned by you): ${address}`);
                }
            } catch (e) {
                // Not a paymaster or revert
            }
        }
    }
}

main().catch(console.error);
