
import { ethers } from "ethers";
import { CONTRACTS } from "./src/config/contracts.js";
import { readFileSync, writeFileSync } from "fs";
import 'dotenv/config';

// 1. Artifacts (assuming standard Foundry output or just flattened ABI)
// Since I don't have the artifact json handy in this context, I'll compile or use a simple deployer if possible.
// Actually, I can likely find the ABI/Bytecode in 'out/AlchemyPaymaster.sol/AlchemyPaymaster.json' if foundry is used.
// Or I can just write a quick deploy script using hardhat/ethers if I have the bytecode.

// Let's assume we can use the existing setup. 
// I'll try to find the artifact first.
const ARTIFACT_PATH = "./out/AlchemyPaymaster.sol/AlchemyPaymaster.json";

async function main() {
    console.log("🚀 Redeploying AlchemyPaymaster...");

    const provider = new ethers.JsonRpcProvider(process.env.VITE_INFURA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("Deployer:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance));

    // Load Artifact
    let artifact;
    try {
        const content = readFileSync(ARTIFACT_PATH, "utf8");
        artifact = JSON.parse(content);
    } catch (e) {
        console.error("❌ Could not find artifact at " + ARTIFACT_PATH);
        console.log("Please run 'forge build' first.");
        return;
    }

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    
    // Deploy (EntryPoint is 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 for v0.6 or similar)
    // Wait, useSmartAccount.ts uses v0.7: entryPoint07Address = '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
    const ENTRY_POINT_07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

    const paymaster = await factory.deploy(ENTRY_POINT_07, wallet.address);
    await paymaster.waitForDeployment();
    
    const paymasterAddress = await paymaster.getAddress();
    console.log("\n✅ NEW Paymaster Deployed at:", paymasterAddress);

    // Update config file
    console.log("Updating contracts.ts...");
    const configPath = "./src/config/contracts.ts";
    let config = readFileSync(configPath, "utf8");
    // Regex replace the address
    config = config.replace(/export const PAYMASTER_ADDRESS = "0x[a-fA-F0-9]{40}";/, `export const PAYMASTER_ADDRESS = "${paymasterAddress}";`);
    writeFileSync(configPath, config);

    // Whitelist Contracts
    console.log("\n📋 Whitelisting Vaults & NFTs...");
    const targets = [
        CONTRACTS.ElementNFT.address,
        CONTRACTS.YieldVault.address,
        CONTRACTS.Alchemist.address
    ];

    for (const target of targets) {
        console.log(`Whitelisting ${target}...`);
        const tx = await paymaster.setSponsoredContract(target, true);
        await tx.wait();
        console.log("Done.");
    }

    // Fund Paymaster
    console.log("\n💰 Funding Paymaster with 0.05 ETH...");
    const fundTx = await paymaster.deposit({ value: ethers.parseEther("0.05") });
    await fundTx.wait();
    console.log("Funded.");

    console.log("\n🎉 Paymaster System Restored!");
}

main().catch(console.error);
