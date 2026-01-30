import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { CONTRACTS } from "./src/config/contracts";
import PaymasterArtifact from "./src/abi/AlchemyPaymaster.sol/AlchemyPaymaster.json";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.VITE_INFURA_RPC_URL;

// EntryPoint 0.7 Address (Sepolia)
const ENTRY_POINT_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function main() {
    if (!PRIVATE_KEY || !RPC_URL) throw new Error("Missing env vars");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`Deployer: ${wallet.address}`);
    
    const factory = new ethers.ContractFactory(
        PaymasterArtifact.abi,
        PaymasterArtifact.bytecode,
        wallet
    );
    
    console.log("Deploying AlchemyPaymaster...");
    const paymaster = await factory.deploy(ENTRY_POINT_ADDRESS, wallet.address);
    await paymaster.waitForDeployment();
    
    const address = await paymaster.getAddress();
    console.log(`✅ AlchemyPaymaster deployed to: ${address}`);

    // Whitelist
    console.log("Whitelisting contracts...");
    const targets = [
        CONTRACTS.ElementNFT.address,
        CONTRACTS.Alchemist.address
    ];

    for (const target of targets) {
        const tx = await paymaster.setSponsoredContract(target, true);
        console.log(` Whitelisted ${target}: ${tx.hash}`);
        await tx.wait();
    }
    
    // Deposit
    console.log("Depositing valid ETH...");
    const depositTx = await paymaster.deposit({ value: ethers.parseEther("0.1") });
    await depositTx.wait();
    console.log(` Deposited 0.1 ETH: ${depositTx.hash}`);

    // Write to file for reliability
    const fs = require('fs');
    fs.writeFileSync('paymaster_address.txt', address);
    console.log("Written address to paymaster_address.txt");
    
    console.log("\n⚠️  UPDATE src/config/contracts.ts WITH NEW ADDRESS: " + address);
}

main().catch(console.error);
