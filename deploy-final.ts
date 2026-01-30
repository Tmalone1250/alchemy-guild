import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { CONTRACTS } from "./src/config/contracts";
import PaymasterArtifact from "./src/abi/AlchemyPaymaster.sol/AlchemyPaymaster.json";
import * as fs from "fs";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function main() {
    if (!PRIVATE_KEY || !RPC_URL) throw new Error("Missing env vars");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`\n🚀 Deployer: ${wallet.address}`);
    
    // 1. Deploy
    const factory = new ethers.ContractFactory(PaymasterArtifact.abi, PaymasterArtifact.bytecode, wallet);
    console.log("Deploying Paymaster...");
    const paymaster = await factory.deploy(ENTRY_POINT, wallet.address);
    await paymaster.waitForDeployment();
    const address = await paymaster.getAddress();
    console.log(`✅ Deployed at: ${address}`);

    // 2. Whitelist
    console.log("Whitelisting...");
    try {
        const tx1 = await paymaster.setSponsoredContract(CONTRACTS.ElementNFT.address, true);
        await tx1.wait();
        console.log("ElementNFT whitelisted.");
        
        const tx2 = await paymaster.setSponsoredContract(CONTRACTS.Alchemist.address, true);
        await tx2.wait();
        console.log("Alchemist whitelisted.");
    } catch (e) {
        console.error("Whitelist failed:", e);
    }

    // 3. Fund
    console.log("Funding...");
    try {
        const tx3 = await wallet.sendTransaction({ to: address, value: ethers.parseEther("0.1") });
        await tx3.wait();
        console.log("Funded 0.1 ETH.");
    } catch (e) {
        console.error("Funding failed:", e);
    }

    // 4. Save Address
    fs.writeFileSync("deployed_paymaster.json", JSON.stringify({ address }, null, 2));
    console.log("Refreshed deployed_paymaster.json");
}

main().catch(console.error);
